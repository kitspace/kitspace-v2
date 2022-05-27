const express = require('express')
const morgan = require('morgan')
const next = require('next')
const fetch = require('node-fetch')
const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, port })
const nextHandler = app.getRequestHandler()

main().catch(e => {
  console.error(e)
  process.exit(1)
})

async function main() {
  await app.prepare()
  const server = express()

  if (dev) {
    server.use(morgan('dev'))
  } else {
    server.use(morgan('tiny'))
  }

  server.all('*', async (req, res, next) => {
    req.session = await fetch('http://gitea:3000/user/kitspace/session', {
      headers: { ...req.headers, accept: 'application/json' },
    }).then(r => r.json())
    nextHandler(req, res, next)
  })

  server.listen(port, err => {
    if (err) {
      console.error(err)
    }
  })
}
