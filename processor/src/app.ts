import express from 'express'

import { createProjectsAPI } from './projectAPI'
import { createRemoteAPI } from './remoteAPI'

export function createApp(repoDir, checkIsRepoReady) {
  const app = express()

  createProjectsAPI(app, repoDir, checkIsRepoReady)
  createRemoteAPI(app)

  return app
}
