const express = require('express')

const { createProjectsAPI } = require('./projectAPI')
const { createRemoteAPI } = require('./remoteAPI')
const { ProcessingManager } = require('./processingManager')

function createApp(
  repoDir = '/gitea-data/git/repositories',
  processingManager = ProcessingManager,
) {
  const app = express()

  createProjectsAPI(app, repoDir, processingManager)
  createRemoteAPI(app)

  return app
}

module.exports = { createApp }
