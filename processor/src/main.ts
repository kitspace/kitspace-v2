import log from 'loglevel'
import prexit from 'prexit'
import { createApp } from './app.js'
import { createGiteaDB } from './giteaDB.js'
import { createMeili } from './meili.js'

log.setDefaultLevel((process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO)

async function main() {
  const giteaDB = createGiteaDB()
  const meiliIndex = createMeili()
  const app = createApp('/gitea-data/git/repositories', { giteaDB, meiliIndex })

  prexit(async () => {
    await app.stop()
  })
}

main()
