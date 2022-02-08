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

function createWorkers() {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml, { concurrency: 10 }),
    addWorker('processKicadPCB', processKicadPCB, { concurrency: 10 }),
    addWorker('processSchematics', processSchematics, { concurrency: 2 }),
    addWorker('processPCB', processPCB, { concurrency: 10 }),
    addWorker('processBOM', processBOM, { concurrency: 10 }),
    addWorker('processIBOM', processIBOM, { concurrency: 10 }),
    addWorker('processReadme', processReadme, { concurrency: 10 }),
  ]
  const stop = () => Promise.all(workers.map(worker => worker.close()))
  return stop
}

function addWorker(name, fn, options) {
  const worker = new Worker(name, job => fn(job, job.data), {
    connection,
    ...options,
  })

  worker.on('progress', (job, progress) => {
    events.emit(`${job.name}:${progress.status}`, progress.file, progress.error)
  })

  return worker
}

module.exports = { createWorkers }
