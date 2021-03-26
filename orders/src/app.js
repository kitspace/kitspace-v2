const express = require('express')
const fetch = require('node-fetch')

const { ALLOWED_CORS_DOMAINS } = require('./env')

function cors(req, res, next) {
  const origin = req.get('origin')
  if (!origin) {
    return next()
  }
  if (ALLOWED_CORS_DOMAINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type,X-Csrf-Token')
    res.set('Access-Control-Allow-Credentials', 'true')
    return next()
  }
  return res.sendStatus(401)
}

function createApp() {
  const app = express()

  app.use(cors)

  app.all('*', async (req, res, next) => {
    const { _csrf } = req.query
    if (!_csrf) {
      return res.sendStatus(401)
    }
    const user = await fetch('http://gitea:3000/api/v1/user', {
      credentials: 'include',
      headers: {
        cookie: req.headers.cookie,
        'x-csrf-token': _csrf,
      },
    }).then(r => {
      if (r.status >= 200 && r.status < 400) {
        return r.json()
      }
    })

    if (user == null) {
      return res.sendStatus(401)
    }

    req.session = { user }

    next()
  })

  app.get('/', (req, res) => {
    res.send(req.session.user)
  })

  return app
}

module.exports = { createApp }
