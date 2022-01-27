module.exports = {
  connection: {
    host: 'redis',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
}
