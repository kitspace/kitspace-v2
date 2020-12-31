const ALLOWED_CORS_DOMAINS = process.env.ALLOWED_CORS_DOMAINS
  ? process.env.ALLOWED_CORS_DOMAINS.split(',')
  : []

const DATA_DIR = process.env.DATA_DIR || '/data'

module.exports = { ALLOWED_CORS_DOMAINS, DATA_DIR }
