export const GITEA_URL = process.env.KITSPACE_GITEA_URL
export const DATA_DIR = process.env.DATA_DIR || '/data'
export const GITEA_DB_CONFIG = {
  host: process.env.GITEA_DB_HOST,
  port: process.env.GITEA_DB_PORT,
  user: process.env.GITEA_DB_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.GITEA_DB_PASSWORD,
}
export const MAXIMUM_REPO_MIGRATION_TIME = parseInt(
  process.env.MAXIMUM_REPO_MIGRATION_TIME,
  10,
)

export const REMOTE_API_TOKENS = (process.env.REMOTE_API_TOKENS || '')
  .split(',')
  .map(x => x.trim())
  .filter(x => x)
  .map(x => `Bearer ${x}`)
