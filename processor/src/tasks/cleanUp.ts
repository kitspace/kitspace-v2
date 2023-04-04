import fs from 'node:fs/promises'
import { Job } from 'bullmq'
import { log } from '../log.js'

export default async function cleanUp(job: Job) {
  fs.rm(job.data.inputDir, { recursive: true })
    .then(() => log.debug(`cleanUp: deleted ${job.data.inputDir}`))
    .catch(e => log.error(e))
}
