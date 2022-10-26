import {JobData} from '../jobData.js'
import {S3} from '../s3.js'
import addToSearch from './addToSearch.js'
import processBOM from './processBOM/index.js'
import processReadme from './processReadme/index.js'

export default async function processInfo(job, jobData: JobData, s3: S3) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData, s3),
    processReadme(job, jobData, s3),
  ])
  await addToSearch(job, { ...jobData, bom, readmeHTML })
}
