const { Worker } = require('bullmq')
const { connection } = require('./redisConnection')
const writeKitspaceYaml = require('./tasks/writeKitspaceYaml')
const processGerbers = require('./tasks/processGerbers')
const processKicadPCB = require('./tasks/processKicadPCB')
const processSchematics = require('./tasks/processSchematics')
const processBOM = require('./tasks/processBOM')
const processIBOM = require('./tasks/processIBOM')
const processReadme = require('./tasks/processReadme')
const events = require('./events')

async function processPCB(
  eventBus,
  { checkoutDir, kitspaceYaml, filesDir, hash, name },
) {
  const plottedGerbers = await processKicadPCB(eventBus, {
    checkoutDir,
    kitspaceYaml,
    filesDir,
  })
  const zipVersion = hash.slice(0, 7)
  return processGerbers(eventBus, {
    checkoutDir,
    kitspaceYaml,
    filesDir,
    zipVersion,
    name,
    plottedGerbers,
  })
}

const workerFunctions = {
  writeKitspaceYaml,
  processKicadPCB,
  processSchematics,
  processPCB,
  processBOM,
  processIBOM,
  processReadme,
}

function createWorkers() {
  const workers = []
  for (const name of Object.keys(workerFunctions)) {
    workers.push(addWorker(name))
  }
  const stop = () => Promise.all(workers.map(worker => worker.close()))
  return stop
}

function addWorker(name) {
  const worker = new Worker(name, job => workerFunctions[name](job, job.data), {
    connection,
  })

  worker.on('progress', (job, progress) => {
    events.emit(`${job.name}:${progress.status}`, progress.file, progress.error)
  })

  return worker
}

module.exports = { createWorkers }
