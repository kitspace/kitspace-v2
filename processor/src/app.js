const express = require('express')

const { createProjectsAPI } = require('./projectAPI')
const { createRemoteAPI } = require('./remoteAPI')

function createApp(repoDir = '/gitea-data/git/repositories') {
  const app = express()

  createProjectsAPI(app, repoDir)
  createRemoteAPI(app)

  return app
}

module.exports = { createApp }
