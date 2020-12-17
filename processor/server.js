const express = require('express')
const path = require('path')

const watcher = require('./watcher')
const eventEmitter = watcher.watch()

const files = {}

eventEmitter.on('in_progress', x => {
  files[x] = 'in_progress'
  console.info('in_progress', x)
})

eventEmitter.on('done', x => {
  files[x] = 'done'
  console.info('done', x)
})

const app = express()
const port = 5000
const staticFiles = express.static('/data/')

app.get('/files/*', (req, res, next) => {
  const x = path.relative('/files/', req.path)
  if (x in files) {
    if (files[x] === 'in_progress') {
      return res.sendStatus(202)
    }
    if (files[x] === 'done') {
      return staticFiles(req, res, next)
    }
  }
  return res.sendStatus(404)
})

app.listen(port, () => {
  console.info(`processor listening on http://localhost:${port}`)
})
