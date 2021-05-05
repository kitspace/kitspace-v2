import { createApp } from './app.js'

const app = createApp()

const port = 5000

app.listen(port, () => {
  console.info(`orders listening on http://localhost:${port}`)
})
