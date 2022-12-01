import path from 'node:path'
import fs from 'node:fs/promises'
import { Job, JobData } from '../job.js'
import processGerbers, {
  outputFiles as gerberFiles,
} from './processGerbers/index.js'
import processKicadPCB, {
  outputFiles as kicadFiles,
} from './processKicadPCB/index.js'

export const outputFiles = [...gerberFiles, ...kicadFiles] as const

export default async function processPCB(job: Job, jobData: JobData) {
  const tmpDir = path.join('/tmp/kitspace', jobData.outputDir)
  await fs.mkdir(tmpDir, { recursive: true })
  try {
    const plottedGerbers = await processKicadPCB(job, { tmpDir, ...jobData })
    await processGerbers(job, { ...jobData, plottedGerbers })
  } finally {
    await fs.rm(tmpDir, { force: true, recursive: true })
  }
}
