import { JobData } from '../jobData.js'
import processGerbers from './processGerbers/index.js'
import processKicadPCB from './processKicadPCB/index.js'

export default async function processPCB(job, jobData: JobData, s3) {
  const plottedGerbers = await processKicadPCB(job, jobData, s3)
  await processGerbers(job, { ...jobData, plottedGerbers })
}
