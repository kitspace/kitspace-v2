const express = require('express')

const { createProjectsAPI } = require('./projectAPI')
const { createRemoteAPI } = require('./remoteAPI')

function createApp(repoDir, processingManager) {
  const app = express()

  createProjectsAPI(app, repoDir, processingManager)
  createRemoteAPI(app)

  return app
}

module.exports = { createApp }
