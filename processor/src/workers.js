const { Worker } = require('bullmq')
const { connection } = require('./redisConnection')
const writeKitspaceYaml = require('./tasks/writeKitspaceYaml')
const processPCB = require('./tasks/processPCB')
const processKicadPCB = require('./tasks/processKicadPCB')
const processSchematics = require('./tasks/processSchematics')
const processBOM = require('./tasks/processBOM')
const processIBOM = require('./tasks/processIBOM')
const processReadme = require('./tasks/processReadme')
const events = require('./events')

const defaultConcurrency = 2

function createWorkers() {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml),
    addWorker('processKicadPCB', processKicadPCB),
    addWorker('processSchematics', processSchematics, { concurrency: 1 }),
    addWorker('processPCB', processPCB),
    addWorker('processBOM', processBOM),
    addWorker('processIBOM', processIBOM),
    addWorker('processReadme', processReadme),
  ]
  const stop = () => Promise.all(workers.map(worker => worker.close()))
  return stop
}

function addWorker(name, fn, options) {
  const worker = new Worker(name, job => fn(job, job.data), {
    connection,
    concurrency: defaultConcurrency,
    ...options,
  })

  worker.on('progress', (job, progress) => {
    events.emit(`${job.name}:${progress.status}`, progress.file, progress.error)
  })

  return worker
}

module.exports = { createWorkers }
