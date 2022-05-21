import processBOM from './processBOM'
import processReadme from './processReadme'
import addToSearch from './addToSearch'
import { JobData } from '../jobData'

export default async function processInfo(
  job,
  { searchId, inputDir, kitspaceYaml, outputDir, repoFullName, hash }: JobData,
) {
  const [bom, readmeHTML] = await Promise.all([
    processBOM(job, {
      inputDir,
      kitspaceYaml,
      outputDir,
    }),
    processReadme(job, {
      inputDir,
      kitspaceYaml,
      outputDir,
      repoFullName,
    }),
  ])
  return addToSearch(job, {
    searchId,
    bom,
    repoFullName,
    kitspaceYaml,
    hash,
    readmeHTML,
  })
}
