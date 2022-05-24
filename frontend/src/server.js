const express = require('express')
const morgan = require('morgan')
const next = require('next')
const fetch = require('node-fetch')
const { MeiliSearch } = require('meilisearch')
const conf = require('../next.config.js')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, conf })

const nextHandler = app.getRequestHandler()

main().catch(e => {
  console.error(e)
  process.exit(1)
})

async function main() {
  const meiliMaster = new MeiliSearch({
    host: 'http://meilisearch:7700',
    apiKey: process.env.MEILI_MASTER_KEY,
  })

  // get the api key which _only_ has the "search" capability
  const meiliKeys = await meiliMaster.getKeys()
  const meiliSearchOnlyKey = meiliKeys.results.find(
    key => key.actions.length === 1 && key.actions[0] === 'search',
  )
  if (meiliSearchOnlyKey == null) {
    throw Error('No meilisearch api key for frontend found.')
  }

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
    req.session.meiliApiKey = meiliSearchOnlyKey.key
    nextHandler(req, res, next)
  })

  server.listen(port, err => {
    if (err) {
      console.error(err)
    }
  })
}
