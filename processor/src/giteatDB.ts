import postgres, { Row, ReplicationEvent, SubscriptionHandle } from 'postgres'

import { GITEA_DB_CONFIG } from './env.js'

const sql = postgres(GITEA_DB_CONFIG)

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

enum MigrationStatus {
  Done = 4,
}

export interface GiteaDB {
  getRepoInfo(ownerName: string, repoName: string): Promise<RepoInfo | undefined>
  waitForNonEmpty(repoId: string): Promise<void>
  waitForRepoMigration(repoId: string): Promise<void>
  subscribeToRepoDeletions(
    callback: (row: Row | null, info: ReplicationEvent) => void,
  ): Promise<SubscriptionHandle>
}

export const giteaDB: GiteaDB = {
  /**
   * Get repository info from the Gitea DB.
   */
  async getRepoInfo(ownerName, repoName) {
    const rows = await sql<RepoInfo[]>`
      SELECT id, is_mirror, is_empty, owner_name, name, description, original_url, default_branch
        FROM repository WHERE lower(owner_name)=${ownerName.toLowerCase()} AND
        lower_name=${repoName.toLowerCase()}`

    return rows[0]
  },

  /**
   * Wait for a repository to have `is_empty` set to false in the Gitea DB.
   */
  async waitForNonEmpty(repoId) {
    const rows =
      await sql`SELECT EXISTS (SELECT 1 FROM repository WHERE id=${repoId} AND is_empty=${false})`

    if (rows[0]?.exists) {
      return
    }

    await once(`repository=${repoId}`, row => !row.is_empty)
  },

  /**
   * Wait for a repository's migration to be marked as done in the Gitea DB.
   */
  async waitForRepoMigration(repoId) {
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
  },

  /**
   * Subscribe to repository deletions.
   */
  async subscribeToRepoDeletions(callback) {
    return sql.subscribe('delete:repository', callback)
  },
}

function once(event: string, testFunction: (row: Row) => boolean): Promise<void> {
  return new Promise(resolve => {
    const sub = sql.subscribe(event, row => {
      if (testFunction(row)) {
        sub.then(({ unsubscribe }) => unsubscribe())
        resolve()
      }
    })
  })
}
