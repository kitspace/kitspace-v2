const app = require('./app').createApp()
const port = 5000
app.listen(port, () => {
  console.info(`processor listening on http://localhost:${port}`)
})
