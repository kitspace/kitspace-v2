import * as chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import * as log from 'loglevel'
import * as path from 'path'
import * as jsYaml from 'js-yaml'
import * as bullmq from 'bullmq'

import { exists, exec, readFile } from './utils'
import { DATA_DIR } from './env'
import connection from './redisConnection'

const defaultJobOptions = { removeOnComplete: true }
const writeKitspaceYamlQueue = new bullmq.Queue('writeKitspaceYaml', {
  connection,
  defaultJobOptions,
})
const processPCBQueue = new bullmq.Queue('processPCB', {
  connection,
  defaultJobOptions,
})
const processBOMQueue = new bullmq.Queue('processBOM', {
  connection,
  defaultJobOptions,
})
const processIBOMQueue = new bullmq.Queue('processIBOM', {
  connection,
  defaultJobOptions,
})
const processReadmeQueue = new bullmq.Queue('processReadme', {
  connection,
  defaultJobOptions,
})

/**
 *
 * @param {*} events
 * @param {string=} repoDir
 * @param {function=} checkIsRepoReady
 * @returns
 */
export function watch(repoDir, checkIsRepoReady) {
  let dirWatchers = {}

  // watch repositories for file-system events and process the project
  const handleAddDir = gitDir => {
    log.debug('addDir', gitDir)

    // we debounce the file-system event to only invoke once per change in the repo
    const debouncedProcessRepo = debounce(async () => {
      const isReady = checkIsRepoReady == null || (await checkIsRepoReady(gitDir))
      if (isReady) {
        processRepo(repoDir, gitDir)
      }
    }, 1000)

    dirWatchers[gitDir] = {}
    dirWatchers[gitDir].add = chokidar.watch(gitDir).on('add', debouncedProcessRepo)

    // if the repo is moved or deleted we clean up the watcher
    dirWatchers[gitDir].unlinkDir = chokidar.watch(gitDir).on('unlinkDir', dir => {
      if (dir === gitDir) {
        log.debug('deleting', gitDir)
        dirWatchers[gitDir].add.close()
        dirWatchers[gitDir].unlinkDir.close()
        delete dirWatchers[gitDir]
      }
    })
  }

  const repoWildcard = path.join(repoDir, '*', '*')
  let watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)

  // re-scan every minute in case we missed a file-system event
  const timer = setInterval(() => {
    watcher.close()
    for (const gitDir of Object.keys(dirWatchers)) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    dirWatchers = {}
    watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)
  }, 60_000)

  const unwatch = () => {
    clearInterval(timer)
    watcher.close()
    for (const gitDir of Object.keys(dirWatchers)) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
  }

  return unwatch
}

async function processRepo(repoDir, gitDir) {
  // /repositories/user/project.git -> user/project
  const name = path.relative(repoDir, gitDir).slice(0, -4)
  const inputDir = path.join(DATA_DIR, 'checkout', name)

  await sync(gitDir, inputDir)

  const hash = await getGitHash(inputDir)
  const outputDir = path.join(DATA_DIR, 'files', name, hash)

  await exec(`mkdir -p ${outputDir}`)

  const kitspaceYaml = await getKitspaceYaml(inputDir)

  writeKitspaceYamlQueue.add('projectAPI', { kitspaceYaml, outputDir })

  if (kitspaceYaml.multi) {
    for (const projectName of Object.keys(kitspaceYaml.multi)) {
      const projectOutputDir = path.join(outputDir, projectName)
      const projectKitspaceYaml = kitspaceYaml.multi[projectName]
      addToQueues(
        inputDir,
        projectKitspaceYaml,
        projectOutputDir,
        projectName,
        hash,
      )
    }
  } else {
    addToQueues(inputDir, kitspaceYaml, outputDir, name, hash)
  }
}

function addToQueues(inputDir, kitspaceYaml, outputDir, name, hash) {
  processPCBQueue.add(
    'projectAPI',
    {
      inputDir,
      kitspaceYaml,
      outputDir,
      hash,
      name,
    },
    { jobId: outputDir },
  )
  processBOMQueue.add(
    'projectAPI',
    { inputDir, kitspaceYaml, outputDir },
    { jobId: outputDir },
  )
  processIBOMQueue.add(
    'projectAPI',
    {
      inputDir,
      kitspaceYaml,
      outputDir,
      name,
    },
    { jobId: outputDir },
  )
  processBOMQueue.add(
    'projectAPI',
    { inputDir, kitspaceYaml, outputDir },
    { jobId: outputDir },
  )
  processReadmeQueue.add(
    'projectAPI',
    {
      inputDir,
      kitspaceYaml,
      outputDir,
      name,
    },
    { jobId: outputDir },
  )
}

async function getKitspaceYaml(inputDir) {
  const filePaths = [
    'kitspace.yaml',
    'kitspace.yml',
    'kitnic.yaml',
    'kitnic.yml',
  ].map(p => path.join(inputDir, p))
  const yamlFile = await Promise.all(filePaths.map(tryReadFile)).then(
    ([yaml, yml, kitnicYaml, kitnicYml]) => yaml || yml || kitnicYaml || kitnicYml,
  )
  return jsYaml.safeLoad(yamlFile) || {}
}

async function getGitHash(checkoutDir) {
  const { stdout } = await exec(`cd '${checkoutDir}' && git rev-parse HEAD`)
  return stdout.slice(0, -1)
}

function tryReadFile(filePath) {
  return readFile(filePath).catch(err => {
    // just return an empty string if the file doesn't exist
    if (err.code === 'ENOENT') {
      return ''
    }
    throw err
  })
}

async function sync(gitDir, checkoutDir) {
  if (await exists(checkoutDir)) {
    await exec(`cd ${checkoutDir} && git pull`).catch(err => {
      // repos with no branches yet will create this error
      if (
        err.stderr ===
        "Your configuration specifies to merge with the ref 'refs/heads/master'\nfrom the remote, but no such ref was fetched.\n"
      ) {
        log.warn('repo without any branches', checkoutDir)
        return err
      }
      throw err
    })
  } else {
    await exec(`git clone ${gitDir} ${checkoutDir}`)
    log.debug('cloned into', checkoutDir)
  }
}
