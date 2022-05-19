import express from 'express'

import { createProjectsAPI } from './projectAPI'
import { createRemoteAPI } from './remoteAPI'

export function createApp(repoDir, checkIsRepoReady) {
  const app = express()

  app.cleanup = []

  createProjectsAPI(app, repoDir, checkIsRepoReady)
  createRemoteAPI(app)

  app.stop = async () => {
    await Promise.all(app.cleanup.map(cleanupFunction => cleanupFunction()))
  }

  return app
}
