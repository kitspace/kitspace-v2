import { JobData } from '../jobData.js'
import processGerbers from './processGerbers/index.js'
import processKicadPCB from './processKicadPCB/index.js'

export default async function processPCB(job, jobData: JobData) {
  const plottedGerbers = await processKicadPCB(job, jobData)
  await processGerbers(job, { ...jobData, plottedGerbers })
}
