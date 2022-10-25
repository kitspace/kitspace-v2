import log from 'loglevel'
import prexit from 'prexit'

import { createApp } from './app.js'
import { createS3 } from './s3.js'
import { giteaDB } from './giteatDB.js'

log.setDefaultLevel((process.env.LOG_LEVEL as log.LogLevelDesc) || log.levels.INFO)

async function main() {
  const s3 = await createS3()
  const app = createApp('/gitea-data/git/repositories', { giteaDB, s3 })

  const port = 5000
  app.listen(port, () => {
    log.info(`processor listening on http://localhost:${port}`)
  })

  prexit(async () => {
    await app.stop()
  })
}

main()
