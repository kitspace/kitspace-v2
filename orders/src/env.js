export const ALLOWED_CORS_DOMAINS = process.env.ALLOWED_CORS_DOMAINS
  ? process.env.ALLOWED_CORS_DOMAINS.split(',')
  : []
