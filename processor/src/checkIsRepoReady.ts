import { exponential as backOff } from 'backoff'
import * as log from 'loglevel'
import { Client } from 'pg'

import { GITEA_DB_CONFIG, MAXIMUM_REPO_MIGRATION_TIME } from './env'

const BACKOFF_INITIAL_DELAY = 100
const MAXIMUM_NUM_OF_RETRIES = Math.ceil(
  Math.log2(MAXIMUM_REPO_MIGRATION_TIME / BACKOFF_INITIAL_DELAY),
)

const client = new Client(GITEA_DB_CONFIG)

client.connect(e => {
  if (e) {
    log.error('Failed to connect to gitea DB')
    throw e
  } else {
    log.info('Connected to gitea DB')
  }
})

/**
 *  - When migrating a repo [1]: Gitea creates an empty repo then the migration
 *    starts.
 *  - When uploading user files [2]: we create an empty repo,
 *    upload the files, finally commit the files to the repo.
 *  - When the processor gets notified by a file-system change when the
 *    repository is created in both [1], and [2] the repo is still empty and
 *    the `git checkout` command fails.
 *  - The processing manager only marks a repo as ready for processing if:
 *      - it isn't empty,
 *      - the migration task is done.
 *
 * @param {string} lowerCaseOwnerName
 * @param {string} lowerCaseRepoName
 * @returns
 */
export async function checkIsRepoReady(lowerCaseOwnerName, lowerCaseRepoName) {
  const { id, isEmpty, isMirror, repoName, ownerName } =
    await queryGiteaRepoDetails(lowerCaseOwnerName, lowerCaseRepoName)

  if (isEmpty) {
    log.debug(
      `Repo: ${ownerName}/${repoName} has no branches, it won't be processed!`,
    )
    return { isReady: false, id, ownerName, repoName }
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
      return { isReady: true, id, ownerName, repoName }
    }
    log.debug(
      `Repo: ${ownerName}/${repoName} is ${status} not ${MigrationStatusIsDone}, the repo is unprocessable.`,
    )
    return { isReady: false, id, ownerName, repoName }
  }

  log.debug(`Repo: ${ownerName}/${repoName} is processable.`)
  return { isReady: true, id, ownerName, repoName }
}

/**
 *
 * @param {string} ownerName
 * @param {string} repoName
 * @returns {Promise<{id: string, isEmpty: boolean, isMirror: boolean, ownerName: string, repoName: string}>}
 */
async function queryGiteaRepoDetails(ownerName, repoName) {
  const repoQuery = {
    name: 'fetch-repository',
    text:
      'SELECT id, is_mirror, is_empty, owner_name, name FROM repository' +
      ' WHERE lower(owner_name)=$1 AND lower_name=$2',
    values: [ownerName, repoName],
  }

  const { id, is_empty, is_mirror, owner_name, name } =
    await queryGiteaRepoWithBackoff(repoQuery)

  return {
    id,
    isMirror: is_mirror,
    isEmpty: is_empty,
    ownerName: owner_name,
    repoName: name,
  }
}

/**
 * Query the migration task status for a gitea repo, with exponential backoff.
 */
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function queryGiteaRepoWithBackoff(repoQuery): Promise<any> {
  const [ownerName, repoName] = repoQuery.values

  const onBackoff = async (num, delay, resolve) => {
    log.debug(
      `Backoff started, querying repo ${ownerName}/${repoName}: ${num} ${delay}ms`,
    )
    const repoQueryResult = await client.query(repoQuery)

    if (repoQueryResult.rows.length === 1) {
      log.debug(`Repo: ${ownerName}/${repoName} was found`)
      return resolve(repoQueryResult.rows[0])
    }
  }

  const onFail = reject =>
    reject(
      new Error(
        `Repo: ${ownerName}/${repoName} not found after ${MAXIMUM_NUM_OF_RETRIES} trials.`,
      ),
    )

  return asyncBackoff(onBackoff, onFail, MAXIMUM_NUM_OF_RETRIES)
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

  const repoMigrationStatus = await queryMigrationStatusWithBackoff(
    migrationStatusQuery,
    repoId,
  )

  return repoMigrationStatus
}

/**
 * Query the migration task status for a gitea repo, with exponential backoff.
 * @returns
 */
async function queryMigrationStatusWithBackoff(migrationStatusQuery, repoId) {
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
        `Repo: ${repoId} migration task not found after ${MAXIMUM_NUM_OF_RETRIES} trials.`,
      ),
    )

  return asyncBackoff(onBackoff, onFail, MAXIMUM_NUM_OF_RETRIES)
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
async function asyncBackoff(
  onBackoff,
  onFail,
  maximumRetries,
  config = {},
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
): Promise<any> {
  const backoffInstance = backOff({
    ...config,
    initialDelay: BACKOFF_INITIAL_DELAY,
  })
  backoffInstance.failAfter(maximumRetries)

  return new Promise((resolve, reject) => {
    const resetBackoffAndResolve = value => {
      backoffInstance.reset()
      resolve(value)
    }

    backoffInstance
      .on('backoff', (num, delay) => onBackoff(num, delay, resetBackoffAndResolve))
      .on('ready', () => backoffInstance.backoff())
      .on('fail', () => onFail(reject))
      .backoff()
  })
}
