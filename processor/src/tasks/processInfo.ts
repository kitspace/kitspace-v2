import processBOM from './processBOM'
import processReadme from './processReadme'
import addToSearch from './addToSearch'

export default async function processInfo(job, jobData) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData),
    processReadme(job, jobData),
  ])
  return addToSearch(job, { ...jobData, bom, readmeHTML })
}
