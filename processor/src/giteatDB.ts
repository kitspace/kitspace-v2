import postgres from 'postgres'
import { GITEA_DB_CONFIG } from './env'

const sql = postgres(GITEA_DB_CONFIG)

export interface RepoInfo {
  id: string
  is_mirror: boolean
  is_empty: boolean
  owner_name: string
  name: string
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
}

export const giteaDB: GiteaDB = {
  async getRepoInfo(ownerName, repoName) {
    const rows = await sql<RepoInfo[]>`
      SELECT id, is_mirror, is_empty, owner_name, name
        FROM repository WHERE lower(owner_name)=${ownerName.toLowerCase()} AND
        lower_name=${repoName.toLowerCase()}`
    return rows[0]
  },

  async waitForNonEmpty(repoId) {
    const nonEmptyPromise = new Promise<void>(resolve => {
      const sub = sql.subscribe(`repository=${repoId}`, row => {
        if (!row.is_empty) {
          sub.then(({ unsubscribe }) => unsubscribe())
          resolve()
        }
      })
    })

    const rows =
      await sql`SELECT EXISTS (SELECT 1 FROM repository WHERE id=${repoId} AND is_empty=0)`
    if (rows[0]?.exists) {
      return
    }

    return nonEmptyPromise
  },

  async waitForRepoMigration(repoId) {
    const migrationPromise = new Promise<void>(resolve => {
      const sub = sql.subscribe('update:task', row => {
        if (
          row.repo_id === repoId &&
          row.type === TaskType.Migration &&
          row.status === MigrationStatus.Done
        ) {
          sub.then(({ unsubscribe }) => unsubscribe())
          resolve()
        }
      })
    })

    const rows =
      await sql`SELECT EXISTS (SELECT 1 FROM task WHERE repo_id=${repoId} AND
        type=${TaskType.Migration} AND status=${MigrationStatus.Done})`
    if (rows[0]?.exists) {
      return
    }

    return migrationPromise
  },
}
