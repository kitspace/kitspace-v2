const GITEA_URL = process.env.KITSPACE_GITEA_URL
const DATA_DIR = process.env.DATA_DIR || '/data'
const GITEA_DB_CONFIG = {
  host: process.env.GITEA_DB_HOST,
  port: process.env.GITEA_DB_PORT,
  user: process.env.GITEA_DB_USER,
  password: process.env.GITEA_DB_PASSWORD,
}

let REMOTE_API_TOKENS = process.env.REMOTE_API_TOKENS || ''
REMOTE_API_TOKENS = REMOTE_API_TOKENS.split(',')
  .map(x => x.trim())
  .filter(x => x)
  .map(x => `Bearer ${x}`)

module.exports = { GITEA_URL, DATA_DIR, REMOTE_API_TOKENS, GITEA_DB_CONFIG }
