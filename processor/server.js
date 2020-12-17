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

eventEmitter.on('failed', (x, e) => {
  files[x] = ['failed', e]
  console.info('failed', x, e)
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
    if (files[x][0] === 'failed') {
      res.status(424)
      return res.send(files[x][1])
    }
  }
  return res.sendStatus(404)
})

app.listen(port, () => {
  console.info(`processor listening on http://localhost:${port}`)
})
