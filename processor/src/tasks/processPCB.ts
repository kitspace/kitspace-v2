import { Job, JobData } from '../job.js'
import processGerbers, {
  outputFiles as gerberFiles,
} from './processGerbers/index.js'
import processKicadPCB, {
  outputFiles as kicadFiles,
} from './processKicadPCB/index.js'

export const outputFiles = [...gerberFiles, ...kicadFiles] as const

export default async function processPCB(job: Job, jobData: JobData) {
  const plottedGerbers = await processKicadPCB(job, jobData)
  await processGerbers(job, { ...jobData, plottedGerbers })
}
