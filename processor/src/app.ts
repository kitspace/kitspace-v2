import express from 'express'

import { createProjectsAPI } from './projectAPI.js'
import { createRemoteAPI } from './remoteAPI.js'
import { createWorkers } from './workers.js'

interface KitspaceProcessorApp extends express.Express {
  cleanup?: Array<() => Promise<void>>
  stop?: () => Promise<void>
}

export function createApp(repoDir, { giteaDB = null }) {
  const app: KitspaceProcessorApp = express()

  app.cleanup = []

  app.get('/', (req, res) => {
    res.send({ status: 'Kitspace processor is up' })
  })

  createProjectsAPI(app, repoDir, { giteaDB })
  createRemoteAPI(app)

  const stopWorkers = createWorkers({ giteaDB })
  app.cleanup.push(stopWorkers)

  app.stop = async () => {
    await Promise.all(app.cleanup.map(cleanupFunction => cleanupFunction()))
  }

  return app
}
