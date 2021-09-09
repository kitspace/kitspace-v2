const GITEA_URL = process.env.KITSPACE_GITEA_URL
const DATA_DIR = process.env.DATA_DIR || '/data'
let REMOTE_API_TOKENS = process.env.REMOTE_API_TOKENS || ''
REMOTE_API_TOKENS = REMOTE_API_TOKENS.split(',')
  .map(x => x.trim())
  .filter(x => x)
  .map(x => `Bearer ${x}`)

module.exports = { GITEA_URL, DATA_DIR, REMOTE_API_TOKENS }
