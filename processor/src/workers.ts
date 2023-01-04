import bullmq from 'bullmq'
import globule from 'globule'
import path from 'node:path'
import { Job, JobProgress } from './job.js'
import { log } from './log.js'
import connection from './redisConnection.js'
import * as s3 from './s3.js'
import * as search from './tasks/addToSearch.js'
import cleanUp from './tasks/cleanUp.js'
import processIBOM, { outputFiles as ibomFiles } from './tasks/processIBOM/index.js'
import processInfo, { outputFiles as infoFiles } from './tasks/processInfo.js'
import processPCB, { outputFiles as pcbFiles } from './tasks/processPCB.js'
import writeKitspaceYaml, {
  outputFiles as kitspaceYamlFiles,
} from './tasks/writeKitspaceYaml.js'

const defaultConcurrency = 1

const projectOutputFiles: ReadonlyArray<string> = [
  ...ibomFiles,
  ...infoFiles,
  ...pcbFiles,
]
const rootOutputFiles: ReadonlyArray<string> = kitspaceYamlFiles

export function createWorkers() {
  const workers = [
    addWorker('writeKitspaceYaml', writeKitspaceYaml),
    addWorker('processPCB', processPCB),
    addWorker('processInfo', processInfo),
    addWorker('processIBOM', processIBOM),
    addWorker('cleanUp', cleanUp),
  ]

  const dbSubscription = search.continuallySyncDeletions()
  const stop = async () => {
    await Promise.all(workers.map(worker => worker.close()))
    const { unsubscribe } = await dbSubscription
    unsubscribe()
  }
  return stop
}

const filesProcessed = {}

function addWorker(name: string, fn, options?: bullmq.WorkerOptions) {
  const worker = new bullmq.Worker(name, job => fn(job, job.data), {
    connection,
    concurrency: defaultConcurrency,
    ...options,
  })

  worker.on('progress', async (job: Job, progress: JobProgress) => {
    const { outputDir, file, status, error } = progress
    log.debug(`${job.name}:${status}`, file, error || '')
    const filePath = path.relative(outputDir, file)
    // when all project files are done or failed we write a
    // processor-report.json for the project to s3
    if (
      !rootOutputFiles.includes(filePath) &&
      (status === 'done' || status === 'failed')
    ) {
      if (filesProcessed[outputDir] == null) {
        filesProcessed[outputDir] = {}
      }
      const processed = filesProcessed[outputDir]
      processed[filePath] = { status, error }
      const allDone = projectOutputFiles.every(pattern =>
        globule.isMatch(pattern, Object.keys(processed)),
      )
      if (allDone) {
        await s3.uploadFileContents(
          path.join(outputDir, 'processor-report.json'),
          JSON.stringify({ status: 'done', files: processed }, null, 2),
          'application/json',
        )
        delete filesProcessed[outputDir]
      }
    }
  })
  worker.on('failed', err => {
    log.error(err)
  })

  return worker
}
