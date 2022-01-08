const backOff = require('backoff').exponential
const chokidar = require('chokidar')
const { Client } = require('pg')
const debounce = require('lodash.debounce')
const jsYaml = require('js-yaml')
const log = require('loglevel')
const path = require('path')

const { DATA_DIR, GITEA_DB_CONFIG } = require('./env')
const { exists, exec, writeFile, readFile } = require('./utils')
const processGerbers = require('./tasks/processGerbers')
const processBOM = require('./tasks/processBOM')
const processIBOM = require('./tasks/processIBOM')
const processKicadPCB = require('./tasks/processKicadPCB')
const processReadme = require('./tasks/processReadme')

const client = new Client(GITEA_DB_CONFIG)

client.connect(e => {
  if (e) {
    log.error(e)
    throw e
  } else {
    log.info('Connected to gitea DB')
  }
})

const running = {}
function watch(events, repoDir = '/repositories') {
  let dirWatchers = {}

  // watch repositories for file-system events and process the project
  const handleAddDir = gitDir => {
    log.debug('addDir', gitDir)

    // we debounce the file-system event to only invoke once per change in the repo
    // additionally we ignore any invocations that happen while it's already running
    // to prevent it from trying to overwrite files that are already being written to
    const debouncedProcessRepo = debounce(async () => {
      if ((await isProcessable(gitDir)) && !running[gitDir]) {
        running[gitDir] = true
        await processRepo(events, repoDir, gitDir).catch(e => {
          log.error(`Error processing '${gitDir}':`, e)
        })
        running[gitDir] = false
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
    for (const gitDir in dirWatchers) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    dirWatchers = {}
    watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)
  }, 60000)

  const unwatch = () => {
    clearInterval(timer)
    watcher.close()
    for (const gitDir in dirWatchers) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
  }

  return unwatch
}

async function processRepo(events, repoDir, gitDir) {
  // /repositories/user/project.git -> user/project
  const name = path.relative(repoDir, gitDir).slice(0, -4)
  const checkoutDir = path.join(DATA_DIR, 'checkout', name)

  await sync(gitDir, checkoutDir)

  const hash = await getGitHash(checkoutDir)
  const filesDir = path.join(DATA_DIR, 'files', name, hash)

  const kitspaceYamlJson = path.join(filesDir, 'kitspace-yaml.json')
  events.emit('in_progress', kitspaceYamlJson)

  await exec(`mkdir -p ${filesDir}`)

  const kitspaceYaml = await getKitspaceYaml(checkoutDir)

  const processPCB = async () => {
    const plottedGerbers = await processKicadPCB(
      events,
      checkoutDir,
      kitspaceYaml,
      filesDir,
    )
    const zipVersion = hash.slice(0, 7)
    return processGerbers(
      events,
      checkoutDir,
      kitspaceYaml,
      filesDir,
      zipVersion,
      name,
      plottedGerbers,
    )
  }

  await Promise.all([
    writeFile(kitspaceYamlJson, JSON.stringify(kitspaceYaml, null, 2))
      .then(() => events.emit('done', kitspaceYamlJson))
      .catch(err => events.emit('failed', kitspaceYamlJson, err)),
    processPCB(),
    processBOM(events, checkoutDir, kitspaceYaml, filesDir),
    processIBOM(events, checkoutDir, kitspaceYaml, filesDir, hash, name),
    processReadme(events, checkoutDir, kitspaceYaml, filesDir, name),
  ])
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

/**
 *
 * @param {string} gitDir
 */
async function isProcessable(gitDir) {
  const { repoName, ownerName } = parseRepoGitDir(gitDir)
  const { id, isEmpty, isMirror } = await queryGiteaRepoDetails(ownerName, repoName)

  if (isEmpty) {
    log.debug(
      `Repo: ${ownerName}/${repoName} has no branches, it won't be processed!`,
    )
    return false
  }

  if (isMirror) {
    // See gitea/models/task.go
    // https://github.com/kitspace/gitea/blob/d1342b36f1b5e4ac0271d0f01c5270cd087f3575/models/task.go#L22
    const MigrationStatusIsDone = 4
    const status = await queryGiteaRepoMigrationStatus(id)

    if (status === MigrationStatusIsDone) {
      log.debug(
        `Repo: ${ownerName}/${repoName} migration is done, the repo is processable.`,
      )
      return true
    } else {
      log.debug(
        `Repo: ${ownerName}/${repoName} is ${status} not ${MigrationStatusIsDone}, the repo is unprocessable.`,
      )
      return false
    }
  }

  log.debug(`Repo: ${ownerName}/${repoName} is processable.`)
  return true
}

/**
 *
 * @param {string} gitDir the file-system path for the git repo
 * @returns {{ownerName: string, repoName: string}} repo details
 */
function parseRepoGitDir(gitDir) {
  const matcher =
    /^\/gitea-data\/git\/repositories\/(?<ownerName>\w+)\/(?<repoName>\w+)/
  const { ownerName, repoName } = gitDir.match(matcher)?.groups

  if (ownerName == null || repoName == null) {
    throw new Error(`Failed to parse gitDir: ${gitDir}`)
  }

  return { ownerName, repoName }
}

/**
 *
 * @param {string} ownerName
 * @param {string} repoName
 * @returns {Promise<{id: string, isEmpty: boolean, isMirror: boolean}>}
 */
async function queryGiteaRepoDetails(ownerName, repoName) {
  const repoQuery = {
    name: 'fetch-repository',
    text:
      'select id, is_mirror, is_empty from repository' +
      ' where lower(owner_name)=$1 and lower_name=$2',
    values: [ownerName, repoName],
  }

  /**
   * Query the migration task status for a gitea repo, with exponential backoff.
   * @returns
   */
  const queryGiteaRepoWithBackoff = async repoQuery => {
    const queryBackoff = backOff()
    const MaximumRetries = 10
    const [ownerName, repoName] = repoQuery.values

    queryBackoff.failAfter(MaximumRetries)

    return new Promise((resolve, reject) => {
      queryBackoff
        .on('backoff', async (num, delay) => {
          log.debug(
            `Backoff started, querying repo ${ownerName}/${repoName}: ${num} ${delay}ms`,
          )
          const repoQueryResult = await client.query(repoQuery)
          // log.debug(repoQueryResult)

          if (repoQueryResult.rows.length === 1) {
            const { id, is_mirror, is_empty } = repoQueryResult.rows[0]
            log.debug(`Repo: ${ownerName}/${repoName} was found`)
            queryBackoff.reset()
            return resolve({ id, isEmpty: is_empty, isMirror: is_mirror })
          }
        })
        .on('ready', () => {
          queryBackoff.backoff()
        })
        .on('fail', () =>
          reject(
            new Error(
              `Repo: ${ownerName}/${repoName} not found after ${MaximumRetries} trials.`,
            ),
          ),
        )
        .backoff()
    })
  }

  const { id, isEmpty, isMirror } = await queryGiteaRepoWithBackoff(repoQuery)

  return { id, isMirror, isEmpty }
}

/**
 *
 * @param {string} repoId
 * @returns {Promise<number>}
 */
async function queryGiteaRepoMigrationStatus(repoId) {
  // See gitea/models/task.go
  // https://github.com/kitspace/gitea/blob/d1342b36f1b5e4ac0271d0f01c5270cd087f3575/models/task.go#L22
  const MigrationTaskType = 0
  const migrationStatusQuery = {
    name: 'fetch-migration-status',
    text: 'select status from task where repo_id=$1 and type=$2',
    values: [repoId, MigrationTaskType],
  }

  /**
   * Query the migration task status for a gitea repo, with exponential backoff.
   * @returns
   */
  const queryMigrationStatusWithBackoff = async migrationStatusQuery => {
    const queryBackoff = backOff()
    const MaximumRetries = 10

    queryBackoff.failAfter(MaximumRetries)

    return new Promise((resolve, reject) => {
      queryBackoff
        .on('backoff', async (num, delay) => {
          log.debug(
            'Backoff started, querying migration status for repo' +
              `Id(${migrationStatusQuery.values[0]}): ${num} ${delay}ms`,
          )

          const migrationStatusQueryResult = await client.query(
            migrationStatusQuery,
          )
          if (migrationStatusQueryResult.rows.length === 1) {
            const { status } = migrationStatusQueryResult.rows[0]
            log.debug(`Repo: Id(${repoId})'s migration status: ${status}.`)
            queryBackoff.reset()
            return resolve(status)
          }
        })
        .on('ready', () => {
          queryBackoff.backoff()
        })
        .on('fail', () =>
          reject(
            new Error(
              `Repo: ${repoId} migration task not found after ${MaximumRetries} trials.`,
            ),
          ),
        )
        .backoff()
    })
  }
  const repoMigrationStatus = await queryMigrationStatusWithBackoff(
    migrationStatusQuery,
  )

  return repoMigrationStatus
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
      } else {
        throw err
      }
    })
  } else {
    await exec(`git clone ${gitDir} ${checkoutDir}`)
    log.debug('cloned into', checkoutDir)
  }
}

module.exports = { watch }
