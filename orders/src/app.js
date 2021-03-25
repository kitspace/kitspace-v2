const express = require('express')
const fetch = require('node-fetch')

function createApp() {
  const app = express()
  app.use('*', async (req, res, next) => {
    const user = await fetch('http://gitea:3000/api/v1/user', {
      headers: {
        ...req.headers,
        accept: 'application/json',
      },
    }).then(r => r.json())
    req.session = { user }
    next()
  })
  app.get('/', (req, res) => {
    res.send(req.session.user)
  })
  return app
}

module.exports = { createApp }
