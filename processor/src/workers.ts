import * as bullmq from 'bullmq'
import connection from './redisConnection'
import writeKitspaceYaml from './tasks/writeKitspaceYaml'
import processPCB from './tasks/processPCB'
import processKicadPCB from './tasks/processKicadPCB'
import processSchematics from './tasks/processSchematics'
import processInfo from './tasks/processInfo'
import processIBOM from './tasks/processIBOM'
import processReadme from './tasks/processReadme'
import events from './events'

const defaultConcurrency = 1

interface JobProgress {
  status: string
  file: string
  error?: Error
}

export function createWorkers() {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml),
    addWorker('processKicadPCB', processKicadPCB),
    addWorker('processSchematics', processSchematics),
    addWorker('processPCB', processPCB),
    addWorker('processInfo', processInfo),
    addWorker('processIBOM', processIBOM),
    addWorker('processReadme', processReadme),
  ]
  const stop = () => Promise.all(workers.map(worker => worker.close()))
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
