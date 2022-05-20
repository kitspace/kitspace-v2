import * as chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import * as log from 'loglevel'
import * as path from 'path'
import * as jsYaml from 'js-yaml'
import * as bullmq from 'bullmq'

import { exists, exec, readFile } from './utils'
import { DATA_DIR } from './env'
import redisConnection from './redisConnection'

function createQueues() {
  const defaultJobOptions: bullmq.JobsOptions = {
    removeOnComplete: true,
    // remove our failed jobs while developing, so they are re-tried
    // in production we don't want them to be retried since it would waste
    // resources continutally retrying them
    removeOnFail: process.env.NODE_ENV !== 'production',
  }

  const writeKitspaceYamlQueue = new bullmq.Queue('writeKitspaceYaml', {
    connection: redisConnection,
    defaultJobOptions,
  })

  const projectQueues = []
  const processPCBQueue = new bullmq.Queue('processPCB', {
    connection: redisConnection,
    defaultJobOptions,
  })
  projectQueues.push(processPCBQueue)

  const processInfoQueue = new bullmq.Queue('processInfo', {
    connection: redisConnection,
    defaultJobOptions,
  })
  projectQueues.push(processInfoQueue)

  const processIBOMQueue = new bullmq.Queue('processIBOM', {
    connection: redisConnection,
    defaultJobOptions,
  })
  projectQueues.push(processIBOMQueue)

  const processReadmeQueue = new bullmq.Queue('processReadme', {
    connection: redisConnection,
    defaultJobOptions,
  })
  projectQueues.push(processReadmeQueue)

  function createJobs(jobData) {
    const jobId = jobData.outputDir
    for (const q of projectQueues) {
      q.add('projectAPI', jobData, { jobId })
    }
  }

  async function addProjectToQueues(giteaId, repoDir, gitDir, ownerName, repoName) {
    // /repositories/user/project.git -> user/project
    const name = path.relative(repoDir, gitDir).slice(0, -4)
    const inputDir = path.join(DATA_DIR, 'checkout', name)

    await sync(gitDir, inputDir)

    const hash = await getGitHash(inputDir)
    const outputDir = path.join(DATA_DIR, 'files', name, hash)

    await exec(`mkdir -p ${outputDir}`)

    const kitspaceYaml = await getKitspaceYaml(inputDir)

    writeKitspaceYamlQueue.add(
      'projectAPI',
      { kitspaceYaml, outputDir },
      { jobId: outputDir },
    )

    if (kitspaceYaml.multi) {
      for (const projectName of Object.keys(kitspaceYaml.multi)) {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        const searchId = giteaId != null ? `${giteaId}-${projectName}` : null
        createJobs({
          searchId,
          inputDir,
          kitspaceYaml: projectKitspaceYaml,
          outputDir: projectOutputDir,
          name: projectName,
          multiParentName: repoName,
          ownerName,
          hash,
        })
      }
    } else {
      createJobs({
        searchId: giteaId,
        inputDir,
        kitspaceYaml,
        outputDir,
        name: repoName,
        ownerName,
        hash,
        multiParentName: null,
      })
    }
  }

  async function stopQueues() {
    const qs = projectQueues.concat([writeKitspaceYamlQueue])
    await Promise.all(qs.map(q => q.obliterate({ force: true })))
  }
  return { addProjectToQueues, stopQueues }
}

/**
 *
 * @param {*} events
 * @param {string=} repoDir
 * @param {function=} checkIsRepoReady
 * @returns
 */
export function watch(repoDir, checkIsRepoReady) {
  let dirWatchers = {}

  const { addProjectToQueues, stopQueues } = createQueues()

  // watch repositories for file-system events and process the project
  const handleAddDir = gitDir => {
    log.debug('addDir', gitDir)

    // we debounce the file-system event to only invoke once per change in the repo
    const debouncedProcessRepo = debounce(async () => {
      let isReady = true
      let giteaId = null
      let { ownerName, repoName } = parseRepoGitDir(gitDir)
      if (checkIsRepoReady != null) {
        const response = await checkIsRepoReady(ownerName, repoName)
        isReady = response.isReady
        giteaId = response.id
        // use the case-correct names we got from the DB
        ownerName = response.ownerName
        repoName = response.repoName
      }
      if (isReady) {
        addProjectToQueues(giteaId, repoDir, gitDir, ownerName, repoName)
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

  const unwatch = async () => {
    clearInterval(timer)
    watcher.close()
    for (const gitDir of Object.keys(dirWatchers)) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    await stopQueues()
  }

  return unwatch
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

/**
 *
 * @param {string} gitDir the file-system path for the git repo
 * @returns {{ownerName: string, repoName: string}} repo details
 */

function parseRepoGitDir(gitDir) {
  // path on filesystem is something like: /gitea-data/git/repositories/kaspar/ulx3s.git
  const p = gitDir.split('/')
  const ownerName = p[4]
  const repoName = p[5].slice(0, -4)
  if (ownerName == null || repoName == null) {
    throw new Error(`Failed to parse gitDir: ${gitDir}`)
  }
  return { ownerName, repoName }
}
