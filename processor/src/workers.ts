import bullmq from 'bullmq'

import * as search from './tasks/addToSearch.js'
import connection from './redisConnection.js'
import events from './events.js'
import processIBOM from './tasks/processIBOM/index.js'
import processInfo from './tasks/processInfo.js'
import processKicadPCB from './tasks/processKicadPCB/index.js'
import processPCB from './tasks/processPCB.js'
import processSchematics from './tasks/processSchematics/index.js'
import writeKitspaceYaml from './tasks/writeKitspaceYaml.js'

const defaultConcurrency = 1

interface JobProgress {
  status: string
  file: string
  error?: Error
}

export function createWorkers({ giteaDB = null }) {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml),
    addWorker('processKicadPCB', processKicadPCB),
    addWorker('processSchematics', processSchematics),
    addWorker('processPCB', processPCB),
    addWorker('processInfo', processInfo),
    addWorker('processIBOM', processIBOM),
  ]
  let dbSubscription
  if (giteaDB) {
    dbSubscription = search.continuallySyncDeletions(giteaDB)
  }
  const stop = async () => {
    await Promise.all(workers.map(worker => worker.close()))
    dbSubscription?.unsubscribe?.()
  }
  return stop
}

function addWorker(name, fn, options?) {
  const worker = new bullmq.Worker(name, job => fn(job, job.data), {
    connection,
    concurrency: defaultConcurrency,
    ...options,
  })

  worker.on('progress', (job: bullmq.Job, progress: JobProgress) => {
    events.emit(`${job.name}:${progress.status}`, progress.file, progress.error)
  })

  return worker
}
