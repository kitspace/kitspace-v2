import processGerbers from './processGerbers'
import processKicadPCB from './processKicadPCB'
import { JobData } from '../jobData'

export default async function processPCB(job, jobData: JobData) {
  const plottedGerbers = await processKicadPCB(job, jobData)
  await processGerbers(job, { ...jobData, plottedGerbers })
}
