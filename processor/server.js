const watcher = require('./watcher')
const eventEmitter = watcher.watch()

const files = {}

eventEmitter.on('in_progress', x => {
  files[x] = 'in_progress'
  console.log(files)
})
eventEmitter.on('done', x => {
  files[x] = 'done'
  console.log(files)
})
