const chokidar = require('chokidar')
const cp = require('child_process')
const debounce = require('lodash.debounce')
const fs = require('fs')
const path = require('path')
const util = require('util')
const jsYaml = require('js-yaml')
const EventEmitter = require('events')

const { DATA_DIR } = require('./env')
const { exists } = require('./utils')
const processGerbers = require('./tasks/processGerbers')
const processBOM = require('./tasks/processBOM')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)

function watch(eventEmitter, repoDir = '/repositories') {
  let dirWatchers = {}

  // watch repositories for file-system events and process the project
  const handleAddDir = gitDir => {
    console.info('addDir', gitDir)
    // we debounce the file-system event to only invoke once per change in the repo
    const debouncedRun = debounce(() => run(eventEmitter, repoDir, gitDir), 1000)
    dirWatchers[gitDir] = {}
    dirWatchers[gitDir].add = chokidar.watch(gitDir).on('add', debouncedRun)
    // if the repo is moved or deleted we clean up the watcher
    dirWatchers[gitDir].unlinkDir = chokidar.watch(gitDir).on('unlinkDir', dir => {
      if (dir === gitDir) {
        console.info('deleting', gitDir)
        dirWatchers[gitDir].add.close()
        dirWatchers[gitDir].unlinkDir.close()
        delete dirWatchers[gitDir]
      }
    })
  }
  const repoWildcard = path.join(repoDir, '*', '*')
  let watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)

  // re-scan every minute in case we missed a file-system event
  setInterval(() => {
    watcher.close()
    for (const gitDir in dirWatchers) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    dirWatchers = {}
    watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)
  }, 60000)
}

async function run(eventEmitter, repoDir, gitDir) {
  // /repositories/user/project.git -> user/project
  const name = path.relative(repoDir, gitDir).slice(0, -4)
  const checkoutDir = path.join(DATA_DIR, 'checkout', name)

  await sync(gitDir, checkoutDir)

  const hash = await getGitHash(checkoutDir)
  const filesDir = path.join(DATA_DIR, 'files', name, hash)
  await exec(`mkdir -p ${filesDir}`)

  const kitspaceYaml = await getKitspaceYaml(checkoutDir)

  processGerbers(eventEmitter, checkoutDir, kitspaceYaml, filesDir, hash, name)
  processBOM(eventEmitter, checkoutDir, kitspaceYaml, filesDir)
}

async function getKitspaceYaml(checkoutDir) {
  const filePaths = [
    'kitspace.yaml',
    'kitspace.yml',
    'kitnic.yaml',
    'kitnic.yml',
  ].map(p => path.join(checkoutDir, p))
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
        console.warn('repo without any branches', checkoutDir)
        return err
      } else {
        throw err
      }
    })
  } else {
    await exec(`git clone ${gitDir} ${checkoutDir}`)
    console.info('cloned into', checkoutDir)
  }
}

module.exports = { watch }
