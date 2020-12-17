const chokidar = require('chokidar')
const cp = require('child_process')
const debounce = require('lodash.debounce')
const fs = require('fs')
const path = require('path')
const util = require('util')
const jsYaml = require('js-yaml')
const EventEmitter = require('events')

const processGerbers = require('./tasks/processGerbers')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)
const accessPromise = util.promisify(fs.access)

function watch() {
  const eventEmitter = new EventEmitter()
  chokidar.watch('/repositories/*/*').on('addDir', gitDir => {
    const debouncedRun = debounce(() => run(eventEmitter, gitDir), 1000)
    chokidar.watch(gitDir).on('all', debouncedRun)
  })
  return eventEmitter
}

async function run(eventEmitter, gitDir) {
  const name = path.relative('/repositories', gitDir).slice(0, -4)
  const checkoutDir = path.join('/data/checkout', name)

  await sync(gitDir, checkoutDir)

  const hash = await getGitHash(checkoutDir)
  const filesDir = path.join('/data/files', name, hash)
  const headDir = path.join('/data/files', name, 'HEAD')
  //link the HEAD dir to the hash we are currently processing
  await exec(`rm -r '${headDir}' && ln -s --relative '${filesDir}' '${headDir}'`)

  const kitspaceYaml = await getKitspaceYaml(checkoutDir)

  const gerberEventEmitter = new EventEmitter()
  gerberEventEmitter.on('in_progress', x => {
    eventEmitter.emit('in_progress', path.join(name, hash, x))
    eventEmitter.emit('in_progress', path.join(name, 'HEAD', x))
  })
  gerberEventEmitter.on('done', x => {
    eventEmitter.emit('done', path.join(name, hash, x))
    eventEmitter.emit('done', path.join(name, 'HEAD', x))
  })
  processGerbers(gerberEventEmitter, checkoutDir, kitspaceYaml, filesDir)
}

async function getKitspaceYaml(checkoutDir) {
  const filePaths = ['kitspace.yaml', 'kitspace.yml'].map(p =>
    path.join(checkoutDir, p),
  )
  const yamlFile = await Promise.all(
    filePaths.map(tryReadFile),
  ).then(([yaml, yml]) => (yaml ? yaml : yml))
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
    console.log('cloned into', checkoutDir)
  }
}

function exists(file) {
  return accessPromise(file, fs.constants.F_OK)
    .then(x => x == null)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false
      } else {
        throw err
      }
    })
}

module.exports = { watch }
