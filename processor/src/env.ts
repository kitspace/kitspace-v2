export const GITEA_URL = process.env.KITSPACE_GITEA_URL
export const DATA_DIR = process.env.DATA_DIR || '/data'
export const GITEA_DB_CONFIG = {
  host: process.env.GITEA_DB_HOST,
  port: parseInt(process.env.GITEA_DB_PORT, 10),
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

export const S3_CLIENT_CONFIG = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: 'eu-west-2',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
}

export const S3_PROCESSOR_BUCKET_NAME = process.env.S3_PROCESSOR_BUCKET_NAME

export const USE_LOCAL_MINIO = process.env.USE_LOCAL_MINIO === "true"
