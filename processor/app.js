const express = require('express')
const path = require('path')
const EventEmitter = require('events')

const watcher = require('./watcher')

const { ALLOWED_CORS_DOMAINS, DATA_DIR } = require('./env')
const filesDir = path.join(DATA_DIR, 'files')

function createApp(repoDir = '/repositories') {
  const fileStatus = {}
  const links = {}

  const eventEmitter = new EventEmitter()
  eventEmitter.on('in_progress', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'in_progress' }
    const headPath = getHeadPath(x)
    links[headPath] = x
    console.info('in_progress', x)
  })
  eventEmitter.on('done', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'done' }
    console.info('done', x)
  })
  eventEmitter.on('failed', (x, e) => {
    x = path.relative(filesDir, x)
    const error = e.message || e.stderr || 'Unknown error'
    fileStatus[x] = { status: 'failed', error }
    console.info('failed', x, error)
  })
  watcher.watch(eventEmitter, repoDir)

  const app = express()

  app.use((req, res, next) => {
    const origin = req.get('origin')
    if (!origin) {
      return next()
    }
    if (ALLOWED_CORS_DOMAINS.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'GET,OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      res.header('Access-Control-Allow-Credentials', 'true')
      return next()
    }
    return res.sendStatus(403)
  })

  app.get('/status/*', (req, res, next) => {
    let x = path.relative('/status/', req.path)
    if (x in links) {
      x = links[x]
    }
    if (x in fileStatus) {
      return res.send(fileStatus[x])
    }
    return res.sendStatus(404)
  })

  const staticFiles = express.static(DATA_DIR)

  app.get('/files/*', (req, res, next) => {
    const x = path.relative('/files/', req.path)
    if (x in links) {
      return res.redirect(302, path.join('/files/', links[x]))
    }
    if (x in fileStatus) {
      if (fileStatus[x].status === 'in_progress') {
        // send a 202, "Accepted" status when the asset processing is in progress
        return res.sendStatus(202)
      }
      if (fileStatus[x].status === 'done') {
        return staticFiles(req, res, next)
      }
      if (fileStatus[x].status === 'failed') {
        // send a 424, "Failed Dependency" error when the asset processing failed
        res.status(424)
        return res.send(fileStatus[x].error)
      }
    }
    return res.sendStatus(404)
  })

  return app
}

function getHeadPath(x) {
  // path is: user/project/${hash}/file so we replace the hash with "HEAD"
  const p = x.split('/')
  p[2] = 'HEAD'
  return p.join('/')
}

module.exports = { createApp }
