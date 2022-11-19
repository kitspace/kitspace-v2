import bullmq from 'bullmq'
import log from 'loglevel'
import { InjectedDependencies } from './injectedDependencies.js'
import connection from './redisConnection.js'
import * as search from './tasks/addToSearch.js'
import processIBOM from './tasks/processIBOM/index.js'
import processInfo from './tasks/processInfo.js'
import processKicadPCB from './tasks/processKicadPCB/index.js'
import processPCB from './tasks/processPCB.js'
import writeKitspaceYaml from './tasks/writeKitspaceYaml.js'

const defaultConcurrency = 1

interface JobProgress {
  status: string
  file: string
  error?: Error
}

export function createWorkers({ giteaDB, meiliIndex }: InjectedDependencies) {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml),
    addWorker('processKicadPCB', processKicadPCB),
    addWorker('processPCB', processPCB),
    addWorker('processInfo', processInfo, { meiliIndex }),
    addWorker('processIBOM', processIBOM),
  ]

  const dbSubscription = search.continuallySyncDeletions(giteaDB, meiliIndex)
  const stop = async () => {
    await Promise.all(workers.map(worker => worker.close()))
    const { unsubscribe } = await dbSubscription
    unsubscribe()
  }
  return stop
}

function addWorker(name, fn, deps?, options?) {
  const worker = new bullmq.Worker(name, job => fn(job, job.data, deps), {
    connection,
    concurrency: defaultConcurrency,
    ...options,
  })

  worker.on('progress', (job: bullmq.Job, progress: JobProgress) => {
    log.debug(`${job.name}:${progress.status}`, progress.file, progress.error || '')
  })
  worker.on('failed', err => {
    log.error(err)
  })

  return worker
}
