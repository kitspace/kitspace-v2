import prexit from 'prexit'
import { createApp } from './app.js'
import { log } from './log.js'

log.info('🚀 Kitspace processor service is running.')
const app = await createApp('/gitea-data/git/repositories')

prexit(async () => {
  await app.stop()
})
