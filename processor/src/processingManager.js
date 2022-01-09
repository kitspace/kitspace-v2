const backOff = require('backoff').exponential
const log = require('loglevel')
const { Client } = require('pg')

const { GITEA_DB_CONFIG } = require('./env')

const client = new Client(GITEA_DB_CONFIG)

client.connect(e => {
  if (e) {
    log.error('Failed to connect to gitea DB')
    throw e
  } else {
    log.info('Connected to gitea DB')
  }
})

async function isRepoReadyForProcessing(gitDir) {
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
    const [ownerName, repoName] = repoQuery.values

    const onBackoff = async (num, delay, resolve) => {
      log.debug(
        `Backoff started, querying repo ${ownerName}/${repoName}: ${num} ${delay}ms`,
      )
      const repoQueryResult = await client.query(repoQuery)

      if (repoQueryResult.rows.length === 1) {
        const { id, is_mirror, is_empty } = repoQueryResult.rows[0]
        log.debug(`Repo: ${ownerName}/${repoName} was found`)
        return resolve({ id, isEmpty: is_empty, isMirror: is_mirror })
      }
    }

    const onFail = reject =>
      reject(
        new Error(
          `Repo: ${ownerName}/${repoName} not found after ${MaximumRetries} trials.`,
        ),
      )

    return asyncBackoff(onBackoff, onFail, 10)
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
    const onBackoff = async (num, delay, resolve) => {
      log.debug(
        'Backoff started, querying migration status for repo' +
          `Id(${migrationStatusQuery.values[0]}): ${num} ${delay}ms`,
      )

      const migrationStatusQueryResult = await client.query(migrationStatusQuery)
      if (migrationStatusQueryResult.rows.length === 1) {
        const { status } = migrationStatusQueryResult.rows[0]
        log.debug(`Repo: Id(${repoId})'s migration status: ${status}.`)
        return resolve(status)
      }
    }

    const onFail = reject =>
      reject(
        new Error(
          `Repo: ${repoId} migration task not found after ${MaximumRetries} trials.`,
        ),
      )

    return asyncBackoff(onBackoff, onFail, 10)
  }

  const repoMigrationStatus = await queryMigrationStatusWithBackoff(
    migrationStatusQuery,
  )

  return repoMigrationStatus
}

/**
 *
 * @typedef {Object} ExponentialOptions
 * @property {number=} randomisationFactor
 * @property {number=} initialDelay
 * @property {number=} maxDelay
 * @property {number=} factor
 *
 * @param {function(number,  number, function): Promise<void>} onBackoff
 * @param {function(): Promise<void>} onFail
 * @param {number} maximumRetries
 * @param {ExponentialOptions=} config
 * @returns
 */
async function asyncBackoff(onBackoff, onFail, maximumRetries, config) {
  const queryBackoff = backOff(config)
  queryBackoff.failAfter(maximumRetries)

  return new Promise((resolve, reject) => {
    const resetBackoffAndResolve = value => {
      queryBackoff.reset()
      resolve(value)
    }

    queryBackoff
      .on(
        'backoff',
        async (num, delay) => await onBackoff(num, delay, resetBackoffAndResolve),
      )
      .on('ready', () => queryBackoff.backoff())
      .on('fail', async () => await onFail(reject))
      .backoff()
  })
}

const ProcessingManager = {
  client,
  isRepoReadyForProcessing,
}

module.exports = { ProcessingManager }
