import { JobData } from '../jobData.js'
import addToSearch, { outputFiles as addToSearchFiles } from './addToSearch.js'
import processBOM, { outputFiles as bomFiles } from './processBOM/index.js'
import processReadme, { outputFiles as readmeFiles } from './processReadme/index.js'
import { InjectedDependencies } from '../injectedDependencies.js'

export const outputFiles = [
  ...bomFiles,
  ...readmeFiles,
  ...addToSearchFiles,
] as const

export default async function processInfo(
  job,
  jobData: JobData,
  { s3, meiliIndex }: Partial<InjectedDependencies>,
) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, jobData, s3),
    processReadme(job, jobData, s3),
  ])
  await addToSearch(job, { ...jobData, bom, readmeHTML }, { meiliIndex })
}
