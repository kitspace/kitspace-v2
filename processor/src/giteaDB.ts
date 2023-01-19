import postgres, {
  Options,
  ReplicationEvent,
  Row,
  SubscriptionHandle,
} from 'postgres'
import {
  GITEA_DB_HOST,
  GITEA_DB_PASSWORD,
  GITEA_DB_PORT,
  GITEA_DB_USER,
  POSTGRES_DB,
} from './env.js'
import { log } from './log.js'

// not sure why `Options` is parametric, (i.e. what type does it want?), hence we
// use the `never` type
const giteaDBConfig: Options<never> = {
  host: GITEA_DB_HOST,
  port: GITEA_DB_PORT,
  user: GITEA_DB_USER,
  database: POSTGRES_DB,
  password: GITEA_DB_PASSWORD,
}

const sql = postgres(giteaDBConfig)

/**
 * Get repository info from the Gitea DB.
 */
export async function getRepoInfo(
  ownerName: string,
  repoName: string,
): Promise<RepoInfo | undefined> {
  const rows = await sql<Array<RepoInfo>>`
      SELECT id, is_mirror, is_empty, owner_name, name, description, original_url, default_branch
        FROM repository WHERE lower(owner_name)=${ownerName.toLowerCase()} AND
        lower_name=${repoName.toLowerCase()}`

  return rows[0]
}

export async function getAllRepoInfo(): Promise<Array<RepoInfo>> {
  const rows = await sql<Array<RepoInfo>>`
      SELECT id, is_mirror, is_empty, owner_name, name, description, original_url, default_branch
        FROM repository`

  return rows
}

/**
 * Wait for a repository to have `is_empty` set to false in the Gitea DB.
 */
export async function waitForNonEmpty(repoId: string): Promise<void> {
  const rows =
    await sql`SELECT EXISTS (SELECT 1 FROM repository WHERE id=${repoId} AND is_empty=${false})`

  if (rows[0]?.exists) {
    return
  }

  await once(`repository=${repoId}`, row => !row.is_empty)
}

/**
 * Wait for a repository's migration to be marked as done in the Gitea DB.
 */
export async function waitForRepoMigration(repoId: string): Promise<void> {
  const rows =
    await sql`SELECT EXISTS (SELECT 1 FROM task WHERE repo_id=${repoId} AND
        type=${TaskType.Migration} AND status=${MigrationStatus.Done})`

  if (rows[0]?.exists) {
    return
  }

  await once(
    'update:task',
    row =>
      row.repo_id === repoId &&
      row.type === TaskType.Migration &&
      row.status === MigrationStatus.Done &&
      row.default_branch !== '',
  )
}

/**
 * Subscribe to `insert`, `update`, `delete`, or `all` operations on the `repository` table.
 * @param callback - the callback will be called for4 each row that had an operation performed on it.
 */
export async function subscribeToRepoEvents(
  operation: Operation,
  callback: (row: Row | null, info: ReplicationEvent) => Promise<void>,
): Promise<SubscriptionHandle> {
  return sql.subscribe(`${operation}:repository`, callback)
}

/**
 * Subscribe to event stream till testFunction returns true once. Unsubscribe
 * and resolve Promise when it does.
 */
function once(event: string, testFunction: (row: Row) => boolean): Promise<void> {
  return new Promise(resolve => {
    const sub = sql.subscribe(event, row => {
      if (testFunction(row)) {
        sub.then(({ unsubscribe }) => unsubscribe()).catch(e => log.error(e))
        resolve()
      }
    })
  })
}

export interface RepoInfo {
  id: string
  is_mirror: boolean
  is_empty: boolean
  owner_name: string
  default_branch: string
  original_url: string
  name: string
  description: string
}

enum TaskType {
  Migration = 0,
}

export enum Operation {
  // https://github.com/porsager/postgres#operation-------schema--table--primary_key
  Insert = 'insert',
  Update = 'update',
  Delete = 'delete',
  All = '*',
}

enum MigrationStatus {
  Done = 4,
}
