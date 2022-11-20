import { JobData } from '../jobData.js'
import addToSearch, { outputFiles as addToSearchFiles } from './addToSearch.js'
import processBOM, { outputFiles as bomFiles } from './processBOM/index.js'
import processReadme, { outputFiles as readmeFiles } from './processReadme/index.js'

export const outputFiles = [
  ...bomFiles,
  ...readmeFiles,
  ...addToSearchFiles,
] as const

export default async function processInfo(job, jobData: JobData) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData),
    processReadme(job, jobData),
  ])
  await addToSearch(job, { ...jobData, bom, readmeHTML })
}
