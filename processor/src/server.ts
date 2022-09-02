import * as log from 'loglevel'
import prexit from 'prexit'
import { createApp } from './app'
import { giteaDB } from './giteatDB'

const LOG_LEVEL = (process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO
log.setDefaultLevel(LOG_LEVEL)

const app = createApp('/gitea-data/git/repositories', { giteaDB })

const port = 5000
app.listen(port, () => {
  log.info(`processor listening on http://localhost:${port}`)
  log.info('log level is set to ', LOG_LEVEL)
})

prexit(async () => {
  await app.stop()
})
