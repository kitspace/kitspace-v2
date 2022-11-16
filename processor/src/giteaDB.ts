import postgres, {
  Row,
  ReplicationEvent,
  SubscriptionHandle,
  Options,
  Sql,
} from 'postgres'

import {
  GITEA_DB_HOST,
  GITEA_DB_PORT,
  GITEA_DB_PASSWORD,
  GITEA_DB_USER,
  POSTGRES_DB,
} from './env.js'

// not sure why `Options` is parametric, (i.e. what type does it want?), hence we
// use the `never` type
const giteaDBConfig: Options<never> = {
  host: GITEA_DB_HOST,
  port: GITEA_DB_PORT,
  user: GITEA_DB_USER,
  database: POSTGRES_DB,
  password: GITEA_DB_PASSWORD,
}

export function createGiteaDB(): GiteaDB {
  return new GiteaDB()
}

export class GiteaDB {
  // not sure why `Sql` is parametric, (i.e. what type does it want?), hence we
  // use the `never` type
  #sql: Sql<never>

  constructor() {
    this.#sql = postgres(giteaDBConfig)
  }

  /**
   * Get repository info from the Gitea DB.
   */
  async getRepoInfo(
    ownerName: string,
    repoName: string,
  ): Promise<RepoInfo | undefined> {
    const sql = this.#sql
    const rows = await sql<RepoInfo[]>`
      SELECT id, is_mirror, is_empty, owner_name, name, description, original_url, default_branch
        FROM repository WHERE lower(owner_name)=${ownerName.toLowerCase()} AND
        lower_name=${repoName.toLowerCase()}`

    return rows[0]
  }

  /**
   * Wait for a repository to have `is_empty` set to false in the Gitea DB.
   */
  async waitForNonEmpty(repoId: string): Promise<void> {
    const sql = this.#sql
    const rows =
      await sql`SELECT EXISTS (SELECT 1 FROM repository WHERE id=${repoId} AND is_empty=${false})`

    if (rows[0]?.exists) {
      return
    }

    await this.once(`repository=${repoId}`, row => !row.is_empty)
  }

  /**
   * Wait for a repository's migration to be marked as done in the Gitea DB.
   */
  async waitForRepoMigration(repoId: string): Promise<void> {
    const sql = this.#sql
    const rows =
      await sql`SELECT EXISTS (SELECT 1 FROM task WHERE repo_id=${repoId} AND
        type=${TaskType.Migration} AND status=${MigrationStatus.Done})`

    if (rows[0]?.exists) {
      return
    }

    await this.once(
      'update:task',
      row =>
        row.repo_id === repoId &&
        row.type === TaskType.Migration &&
        row.status === MigrationStatus.Done &&
        row.default_branch !== '',
    )
  }

  /**
   * Subscribe to repository deletions.
   */
  async subscribeToRepoDeletions(
    callback: (row: Row | null, info: ReplicationEvent) => void,
  ): Promise<SubscriptionHandle> {
    const sql = this.#sql
    return sql.subscribe('delete:repository', callback)
  }

  /**
   * Subscribe to event stream till testFunction returns true once. Unsubscribe
   * and resolve Promise when it does.
   */
  private once(event: string, testFunction: (row: Row) => boolean): Promise<void> {
    const sql = this.#sql
    return new Promise(resolve => {
      const sub = sql.subscribe(event, row => {
        if (testFunction(row)) {
          sub.then(({ unsubscribe }) => unsubscribe())
          resolve()
        }
      })
    })
  }
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

enum MigrationStatus {
  Done = 4,
}
