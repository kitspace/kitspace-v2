import * as express from 'express'
import log from 'loglevel'
import * as path from 'path'
import fileUpload from 'express-fileupload'
import * as bullmq from 'bullmq'

import { exec, writeFile } from './utils'
import events from './events'
import connection from './redisConnection'

import { DATA_DIR, REMOTE_API_TOKENS } from './env'

const remoteProcessOutputDir = path.join(DATA_DIR, 'remote-process-public')
const remoteProcessInputDir = path.join(DATA_DIR, 'remote-process-input-files')

const defaultJobOptions = { removeOnComplete: true }

export function createRemoteAPI(app) {
  const processKicadPCBQueue = new bullmq.Queue('processKicadPCB', {
    connection,
    defaultJobOptions,
  })
  const processSchematicsQueue = new bullmq.Queue('processSchematics', {
    connection,
    defaultJobOptions,
  })
  app.use(fileUpload())

  const processFileStatus = {}

  events.on('remoteAPI:in_progress', x => {
    x = path.relative(remoteProcessOutputDir, x)
    processFileStatus[x] = { status: 'in_progress' }
    log.debug('in_progress', x)
  })
  events.on('remoteAPI:done', x => {
    x = path.relative(remoteProcessOutputDir, x)
    processFileStatus[x] = { status: 'done' }
    log.debug('done', x)
  })
  events.on('remoteAPI:failed', (x, e) => {
    const error = e.message || e.stderr || 'Unknown error'
    processFileStatus[x] = { status: 'failed', error }
    log.debug('failed', x, error)
  })

  app.post('/process-file', async (req, res) => {
    try {
      if (!REMOTE_API_TOKENS.includes(req.headers.authorization)) {
        return res.sendStatus(403)
      }
      if (req.files == null) {
        return res.status(422).send('No file uploaded')
      }

      const { upload } = req.files
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
      if (!['.kicad_pcb', '.sch'].includes(ext)) {
        return res.status(422).send('Only accepting .kicad_pcb and .sch files')
      }
      const uploadPath = path.join(uploadFolder, upload.md5 + ext)
      const outputDir = path.join(remoteProcessOutputDir, upload.md5)
      await exec(`mkdir -p ${uploadFolder}`)
      await writeFile(uploadPath, upload.data).then(() => {
        if (ext === '.kicad_pcb') {
          processKicadPCBQueue.add(
            'remoteAPI',
            {
              inputDir: uploadFolder,
              outputDir,
            },
            { jobId: outputDir },
          )
        } else if (ext === '.sch') {
          processSchematicsQueue.add(
            'remoteAPI',
            {
              inputDir: uploadFolder,
              outputDir,
            },
            { jobId: outputDir },
          )
        }
      })
      res.status(202).send({
        id: upload.md5,
      })
    } catch (err) {
      log.error(err)
      res.status(500).send(err)
    }
  })

  app.get('/processed/status/*', (req, res) => {
    const x = path.relative('/processed/status/', req.path)
    if (x in processFileStatus) {
      return res.send(processFileStatus[x])
    }
    return res.sendStatus(404)
  })

  const processStaticFiles = express.static(remoteProcessOutputDir)

  app.get('/processed/files/*', (req, res, next) => {
    const x = path.relative('/processed/files/', req.url)

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

  app.cleanup.push(async () => {
    await Promise.all([
      processKicadPCBQueue.obliterate({ force: true }),
      processSchematicsQueue.obliterate({ force: true }),
    ])
  })

  return app
}
