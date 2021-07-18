const DATA_DIR = process.env.DATA_DIR || '/data'
let REMOTE_API_TOKENS = process.env.REMOTE_API_TOKENS || ''
REMOTE_API_TOKENS = REMOTE_API_TOKENS.split(',')
  .map(x => x.trim())
  .filter(x => x)
  .map(x => `Bearer ${x}`)

module.exports = { DATA_DIR, REMOTE_API_TOKENS }
