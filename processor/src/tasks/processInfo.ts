import { JobData } from '../jobData.js'
import addToSearch from './addToSearch.js'
import processBOM from './processBOM/index.js'
import processReadme from './processReadme.js'

export default async function processInfo(job, jobData: JobData) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData),
    processReadme(job, jobData),
  ])
  await addToSearch(job, { ...jobData, bom, readmeHTML })
}
