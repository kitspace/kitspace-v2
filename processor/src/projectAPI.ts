import * as express from 'express'
import log from 'loglevel'
import * as path from 'path'

import * as watcher from './watcher'

import { DATA_DIR } from './env'
import events from './events'

const filesDir = path.join(DATA_DIR, 'files')

export function createProjectsAPI(app, repoDir, { giteaDB, prefix }) {
  const fileStatus = {}
  const redirects = {}

  events.on('projectAPI:in_progress', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'in_progress' }
    const headPath = getHeadPath(x)
    redirects[headPath] = x
    log.debug('in_progress', x)
  })
  events.on('projectAPI:done', x => {
    x = path.relative(filesDir, x)
    fileStatus[x] = { status: 'done' }
    log.debug('done', x)
  })
  events.on('projectAPI:failed', (x, e) => {
    x = path.relative(filesDir, x)
    const error = e.message || e.stderr || 'Unknown error'
    fileStatus[x] = { status: 'failed', error }
    log.debug('failed', x, error)
  })

  const unwatch = watcher.watch(repoDir, { giteaDB, prefix })

  app.cleanup.push(unwatch)

  app.get('/status/*', (req, res) => {
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
