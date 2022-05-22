import processBOM from './processBOM'
import processReadme from './processReadme'
import addToSearch from './addToSearch'
import { JobData } from '../jobData'

export default async function processInfo(job, jobData: JobData) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData),
    processReadme(job, jobData),
  ])
  await addToSearch(job, { ...jobData, bom, readmeHTML })
}
