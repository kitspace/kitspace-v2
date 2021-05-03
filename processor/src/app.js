const EventEmitter = require('events')
const express = require('express')
const log = require('loglevel')
const path = require('path')

const watcher = require('./watcher')

const { ALLOWED_CORS_DOMAINS, DATA_DIR } = require('./env')
const filesDir = path.join(DATA_DIR, 'files')

function createApp(repoDir = '/gitea-data/git/repositories') {
  const fileStatus = {}
  const links = {}

  const events = new EventEmitter()
  events.on('in_progress', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'in_progress' }
    const headPath = getHeadPath(x)
    links[headPath] = x
    log.debug('in_progress', x)
  })
  events.on('done', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'done' }
    log.debug('done', x)
  })
  events.on('failed', (x, e) => {
    x = path.relative(filesDir, x)
    const error = e.message || e.stderr || 'Unknown error'
    fileStatus[x] = { status: 'failed', error }
    log.debug('failed', x, error)
  })
  const unwatch = watcher.watch(events, repoDir)

  const app = express()

  app.stop = unwatch

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
    x = lowerCaseProject(x)
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
    let x = path.relative('/files/', req.path)
    x = lowerCaseProject(x)

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

function lowerCaseProject(x) {
  // USER/PROJECT/FOLDER/FILE.TXT -> user/project/FOLDER/FILE.TXT
  const p = x.split('/')
  p[0] = p[0].toLowerCase()
  p[1] = p[1].toLowerCase()
  return p.join('/')
}

function getHeadPath(x) {
  // path is: user/project/${hash}/file so we replace the hash with "HEAD"
  const p = x.split('/')
  p[2] = 'HEAD'
  return p.join('/')
}

module.exports = { createApp }
