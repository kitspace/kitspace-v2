const EventEmitter = require('events')
const express = require('express')
const log = require('loglevel')
const path = require('path')
const fileUpload = require('express-fileupload')

const processKicadPCB = require('./tasks/processKicadPCB')
const watcher = require('./watcher')
const { writeFile, exec } = require('./utils')

const { DATA_DIR } = require('./env')
const filesDir = path.join(DATA_DIR, 'files')
const remoteProcessOutputDir = path.join(DATA_DIR, 'remote-process-public')
const remoteProcessInputDir = path.join(DATA_DIR, 'remote-process-input-files')

function createApp(repoDir = '/gitea-data/git/repositories') {
  const fileStatus = {}
  const redirects = {}

  const events = new EventEmitter()
  events.on('in_progress', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'in_progress' }
    const headPath = getHeadPath(x)
    redirects[headPath] = x
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

  app.get('/status/*', (req, res, next) => {
    let x = path.relative('/status/', req.path)
    x = lowerCaseProject(x)
    if (x in redirects) {
      x = redirects[x]
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

    if (x in redirects) {
      return res.redirect(302, path.join('/files/', redirects[x]))
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

  app.use(fileUpload())

  const processFileEvents = new EventEmitter()

  const processFileStatus = {}

  processFileEvents.on('in_progress', x => {
    x = path.relative(remoteProcessOutputDir, x)
    processFileStatus[x] = { status: 'in_progress' }
    log.debug('in_progress', x)
  })
  processFileEvents.on('done', x => {
    x = path.relative(remoteProcessOutputDir, x)
    processFileStatus[x] = { status: 'done' }
    log.debug('done', x)
  })
  processFileEvents.on('failed', (x, e) => {
    const error = e.message || e.stderr || 'Unknown error'
    processFileStatus[x] = { status: 'failed', error }
    log.debug('failed', x, error)
  })

  app.post('/process-file', async (req, res) => {
    try {
      if (
        req.headers.authorization !== `Bearer ${process.env.REMOTE_API_TOKEN}`
      ) {
        return res.sendStatus(403)
      }
      if (req.files == null) {
        return res.status(422).send('No file uploaded')
      }

      const upload = req.files.upload
      if (upload == null) {
        return res
          .status(422)
          .send('Form input name for uploaded file needs to be "upload"')
      }
      if (upload.md5 == null) {
        throw Error('Could not hash file')
      }
      const uploadFolder = path.join(remoteProcessInputDir, upload.md5)
      const ext = path.extname(upload.name)
      if (ext !== '.kicad_pcb') {
        return res.status(422).send('Only accepting .kicad_pcb files')
      }
      const uploadPath = path.join(uploadFolder, upload.md5 + ext)
      const outputDir = path.join(remoteProcessOutputDir, upload.md5)
      await exec(`mkdir -p ${uploadFolder}`)
      await writeFile(uploadPath, upload.data).then(() => {
        processKicadPCB(processFileEvents, uploadFolder, {}, outputDir)
      })
      res.status(202).send({
        id: upload.md5,
      })
    } catch (err) {
      log.error(err)
      res.status(500).send(err)
    }
  })

  app.get('/processed/status/*', (req, res, next) => {
    let x = path.relative('/processed/status/', req.path)
    if (x in processFileStatus) {
      return res.send(processFileStatus[x])
    }
    return res.sendStatus(404)
  })

  const processStaticFiles = express.static(remoteProcessOutputDir)

  app.get('/processed/files/*', (req, res, next) => {
    let x = path.relative('/processed/files/', req.url)

    if (x in processFileStatus) {
      if (processFileStatus[x].status === 'in_progress') {
        // send a 202, "Accepted" status when the asset processing is in progress
        return res.sendStatus(202)
      }
      if (processFileStatus[x].status === 'done') {
        req.url = x
        return processStaticFiles(req, res, next)
      }
      if (processFileStatus[x].status === 'failed') {
        // send a 424, "Failed Dependency" error when the asset processing failed
        res.status(424)
        return res.send(processFileStatus[x].error)
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
