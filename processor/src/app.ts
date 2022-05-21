import express from 'express'

import { createProjectsAPI } from './projectAPI'
import { createRemoteAPI } from './remoteAPI'

interface KitspaceProcessorApp extends express.Express {
  cleanup?: Array<() => Promise<void>>
  stop?: () => Promise<void>
}

export function createApp(repoDir, { giteaDB = null }) {
  const app: KitspaceProcessorApp = express()

  app.cleanup = []

  createProjectsAPI(app, repoDir, { giteaDB })
  createRemoteAPI(app)

  app.stop = async () => {
    await Promise.all(app.cleanup.map(cleanupFunction => cleanupFunction()))
  }

  return app
}
