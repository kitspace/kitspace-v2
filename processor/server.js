const express = require('express')
const path = require('path')

const watcher = require('./watcher')

const fileStatus = {}
const links = {}

const eventEmitter = watcher.watch()

eventEmitter.on('in_progress', x => {
  x = path.relative('/data/files', x)
  fileStatus[x] = { status: 'in_progress' }
  links[getHeadPath(x)] = x
  console.info('in_progress', x)
})

eventEmitter.on('done', x => {
  x = path.relative('/data/files', x)
  fileStatus[x] = { status: 'done' }
  console.info('done', x)
})

eventEmitter.on('failed', (x, e) => {
  x = path.relative('/data/files', x)
  fileStatus[x] = {
    status: 'failed',
    error: e.message || e.stderr || 'Unknown error',
  }
  console.info('failed', x, e)
})

const app = express()
const port = 5000

const allowedDomains = process.env.ALLOWED_CORS_DOMAINS.split(',')

app.use((req, res, next) => {
  const origin = req.get('origin')
  if (!origin) {
    return next()
  }
  if (allowedDomains.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Credentials', 'true')
    return next()
  }
  return res.sendStatus(403)
})

const staticFiles = express.static('/data/')

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

app.get('/files/*', (req, res, next) => {
  const x = path.relative('/files/', req.path)
  if (x in links) {
    return res.redirect(302, path.join('/files/', links[x]))
  }
  if (x in fileStatus) {
    if (fileStatus[x].status === 'in_progress') {
      return res.sendStatus(202)
    }
    if (fileStatus[x].status === 'done') {
      return staticFiles(req, res, next)
    }
    if (fileStatus[x].status === 'failed') {
      res.status(424)
      return res.send(fileStatus[x].error)
    }
  }
  return res.sendStatus(404)
})

app.listen(port, () => {
  console.info(`processor listening on http://localhost:${port}`)
})

function getHeadPath(x) {
  // path is: /data/files/x/y/{hash}/... so we replace the hash with "HEAD"
  const p = x.split('/')
  p[5] = 'HEAD'
  return p.join('/')
}
