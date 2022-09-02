import * as log from 'loglevel'
import prexit from 'prexit'
import { createApp } from './app'
import { giteaDB } from './giteatDB'

log.setDefaultLevel((process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO)
console.log({ level: (process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO })

const app = createApp('/gitea-data/git/repositories', { giteaDB })

const port = 5000
app.listen(port, () => {
  log.info(`processor listening on http://localhost:${port}`)
})

prexit(async () => {
  await app.stop()
})
