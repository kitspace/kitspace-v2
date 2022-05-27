import express from 'express'

import { createProjectsAPI } from './projectAPI'
import { createRemoteAPI } from './remoteAPI'
import { createWorkers } from './workers'

interface KitspaceProcessorApp extends express.Express {
  cleanup?: Array<() => Promise<void>>
  stop?: () => Promise<void>
}

export function createApp(repoDir, { giteaDB = null, prefix = null }) {
  const app: KitspaceProcessorApp = express()

  app.cleanup = []

  app.get('/', (req, res) => {
    res.send({ status: 'Kitspace processor is up' })
  })

  createProjectsAPI(app, repoDir, { giteaDB, prefix })
  createRemoteAPI(app)

  const stopWorkers = createWorkers({ giteaDB, prefix })
  app.cleanup.push(stopWorkers)

  app.stop = async () => {
    await Promise.all(app.cleanup.map(cleanupFunction => cleanupFunction()))
  }

  return app
}
