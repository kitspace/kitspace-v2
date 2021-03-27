const log = require('loglevel')
log.setDefaultLevel(process.env.LOG_LEVEL || 'info')

const app = require('./app').createApp()
const port = 5000
app.listen(port, () => {
  log.info(`processor listening on http://localhost:${port}`)
})
