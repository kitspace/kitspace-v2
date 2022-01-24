const express = require('express')

const { createProjectsAPI } = require('./projectAPI')
const { createRemoteAPI } = require('./remoteAPI')

function createApp(repoDir, checkIsRepoReady) {
  const app = express()

  createProjectsAPI(app, repoDir, checkIsRepoReady)
  createRemoteAPI(app)

  return app
}

module.exports = { createApp }
