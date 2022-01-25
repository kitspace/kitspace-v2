const { Worker, Job } = require('bullmq')
const { connection } = require('./redisConnection')
const writeKitspaceYaml = require('./tasks/writeKitspaceYaml')
const processGerbers = require('./tasks/processGerbers')
const processKicadPCB = require('./tasks/processKicadPCB')
const processBOM = require('./tasks/processBOM')
const processIBOM = require('./tasks/processIBOM')
const processReadme = require('./tasks/processReadme')

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
  processPCB,
  processBOM,
  processIBOM,
  processReadme,
}

function createWorkers(eventBus) {
  for (const name in workerFunctions) {
    addWorker(eventBus, name)
  }
}

function addWorker(eventBus, name) {
  new Worker(name, job => workerFunctions[name](eventBus, job.data), {
    connection,
  })
}

module.exports = { createWorkers }
