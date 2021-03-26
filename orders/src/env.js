const ALLOWED_CORS_DOMAINS = process.env.ALLOWED_CORS_DOMAINS
  ? process.env.ALLOWED_CORS_DOMAINS.split(',')
  : []

module.exports = {ALLOWED_CORS_DOMAINS}
