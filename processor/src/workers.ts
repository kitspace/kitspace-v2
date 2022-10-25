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

export function createWorkers({ giteaDB = null, s3 = null }) {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml, s3),
    addWorker('processKicadPCB', processKicadPCB, s3),
    addWorker('processSchematics', processSchematics, s3),
    addWorker('processPCB', processPCB, s3),
    addWorker('processInfo', processInfo, s3),
    addWorker('processIBOM', processIBOM, s3),
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

function addWorker(name, fn, s3, options?) {
  const worker = new bullmq.Worker(name, job => fn(job, job.data, s3), {
    connection,
    concurrency: defaultConcurrency,
    ...options,
  })

  worker.on('progress', (job: bullmq.Job, progress: JobProgress) => {
    events.emit(`${job.name}:${progress.status}`, progress.file, progress.error)
  })

  return worker
}
