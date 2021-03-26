const express = require('express')
const fetch = require('node-fetch')

const { ALLOWED_CORS_DOMAINS } = require('./env')

function createApp() {
  const app = express()

  app.use('*', (req, res, next) => {
    const origin = req.get('origin')
    if (!origin) {
      return next()
    }
    if (ALLOWED_CORS_DOMAINS.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      res.header('Access-Control-Allow-Credentials', 'true')
      return next()
    }
    return res.sendStatus(403)
  })

  app.use('*', async (req, res, next) => {
    const user = await fetch('http://gitea:3000/api/v1/user', {
      headers: {
        ...req.headers,
        accept: 'application/json',
      },
    }).then(r => {
      if (r.status >= 200 && r.status < 400) {
        return r.json()
      }
      return r.text()
    })

    req.session = { user }
  })

  app.get('/', (req, res) => {
    res.send(req.session.user)
  })

  return app
}

module.exports = { createApp }
