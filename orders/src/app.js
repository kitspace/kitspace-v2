const express = require('express')
const fetch = require('isomorphic-unfetch')

function createApp() {
  const app = express()
  app.use('*', async function (req, res, next) {
    const csrf = await fetch('http://gitea:3000/api/swagger', {
      headers: {
        cookie: req.headers.cookie,
      },
    }).then(r => r.headers.get('x-csrf-token'))
    const user = await fetch('http://gitea:3000/api/v1/user', {
      headers: {
        cookie: req.headers.cookie,
        accept: 'application/json',
        'x-csrf-token': csrf,
      },
    }).then(r => r.json())
    res.send(user)
  })
  return app
}

module.exports = { createApp }
