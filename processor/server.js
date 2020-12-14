const http = require('http')
const createHandler = require('gitea-webhook-handler')
const handler = createHandler({
  path: '/gitea-webhook',
  secret: process.env.GITEA_WEBHOOK_SECRET,
})

const PORT = 5000

http
  .createServer((req, res) => {
    handler(req, res, err => {
      res.statusCode = 404
      res.end('no such location')
    })
  })
  .listen(PORT)

console.log('Kitspace asset processor listening on port', PORT)

handler.on('error', err => {
  console.error('Error:', err.message)
})

handler.on('repository', event => {
  console.log('Received a repository event')
  console.log(event.payload)
})

handler.on('push', event => {
  console.log(
    'Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref,
  )
})
