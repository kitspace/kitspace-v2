const log = require('loglevel')
const { ProcessingManager } = require('./processingManager')

log.setDefaultLevel(process.env.LOG_LEVEL || 'info')

const app = require('./app').createApp(
  '/gitea-data/git/repositories',
  ProcessingManager,
)

const port = 5000
app.listen(port, () => {
  log.info(`processor listening on http://localhost:${port}`)
})
