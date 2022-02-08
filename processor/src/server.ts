import * as log from 'loglevel'
import { createApp } from './app'
import { checkIsRepoReady } from './checkIsRepoReady'

log.setDefaultLevel((process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO)

const app = createApp('/gitea-data/git/repositories', checkIsRepoReady)

const port = 5000
app.listen(port, () => {
  log.info(`processor listening on http://localhost:${port}`)
})
