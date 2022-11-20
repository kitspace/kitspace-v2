import log from 'loglevel'
import prexit from 'prexit'
import { createApp } from './app.js'

log.setDefaultLevel((process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO)

const app = createApp('/gitea-data/git/repositories')

prexit(async () => {
  await app.stop()
})
