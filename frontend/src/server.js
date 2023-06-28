/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express')
const morgan = require('morgan')
const next = require('next')
const fetch = require('node-fetch')
const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.KITSPACE_DOMAIN

const app = next({ dev, port, hostname })
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

  server.get('/:user/:repo/:project/1-click-BOM.tsv', (req, res) => {
    const { user, repo, project } = req.params
    return res.redirect(
      307,
      `${process.env.KITSPACE_ASSET_URL}/${user}/${repo}/HEAD/${project}/1-click-BOM.tsv`,
    )
  })

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
