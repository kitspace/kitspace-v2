export const GITEA_URL = process.env.KITSPACE_GITEA_URL
export const DATA_DIR = process.env.DATA_DIR || '/data'
export const MAXIMUM_REPO_MIGRATION_TIME = parseInt(
  process.env.MAXIMUM_REPO_MIGRATION_TIME,
  10,
)

export const REMOTE_API_TOKENS = (process.env.REMOTE_API_TOKENS || '')
  .split(',')
  .map(x => x.trim())
  .filter(x => x)
  .map(x => `Bearer ${x}`)

export const GITEA_DB_HOST = process.env.GITEA_DB_HOST
export const GITEA_DB_PORT = parseInt(process.env.GITEA_DB_PORT, 10)
export const GITEA_DB_USER = process.env.GITEA_DB_USER
export const GITEA_DB_PASSWORD = process.env.GITEA_DB_PASSWORD
export const POSTGRES_DB = process.env.POSTGRES_DB

export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY
export const S3_ENDPOINT = process.env.S3_ENDPOINT
export const S3_PROCESSOR_BUCKET_NAME = process.env.S3_PROCESSOR_BUCKET_NAME

export const USE_LOCAL_MINIO = process.env.USE_LOCAL_MINIO === 'true'

export const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY

export const LOG_LEVEL = process.env.LOG_LEVEL

if (process.env.KITSPACE_PROCESSOR_ASSET_VERSION == null) {
  throw Error('KITSPACE_PROCESSOR_ASSET_VERSION env variable is missing')
}

export const PROCESSOR_ASSET_VERSION = process.env.KITSPACE_PROCESSOR_ASSET_VERSION
