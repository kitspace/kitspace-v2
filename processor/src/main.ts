import prexit from 'prexit'
import { createApp } from './app.js'
import { log } from './log.js'

const app = createApp('/gitea-data/git/repositories')

prexit(async () => {
  await app.stop()
})

log.info('🚀 Kitspace processor service is running.')
