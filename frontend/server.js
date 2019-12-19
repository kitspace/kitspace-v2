const express = require('express')
const next = require('next')
const conf = require('./next.config.js')
const bodyParser = require('body-parser')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, conf })

const nextHandler = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.use(function(req, res, next) {
    console.log('%s %s', req.method, req.url)
    next()
  })

  server.all('/_next/*', nextHandler)

  server.get('*', bodyParser.json(), (req, res) => {
    // our session information is sent from gitea as the body of a get request
    // this server should not be exposed to the public, i.e. all get requests
    // need to be routed through gitea with any original body removed or we
    // have a security vulnerability
    console.log('XXX %s %s', req.method, req.url)
    req.session = req.body
    req.body = {}
    nextHandler(req, res)
  })

  server.all('*', nextHandler)

  server.listen(port, err => {
    if (err) {
      console.error(err)
    }
  })
})
