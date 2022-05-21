import processGerbers from './processGerbers'
import processKicadPCB from './processKicadPCB'
import { JobData } from '../jobData'

export default async function processPCB(
  job,
  { inputDir, kitspaceYaml, outputDir, hash, repoFullName }: JobData,
) {
  const plottedGerbers = await processKicadPCB(job, {
    inputDir,
    kitspaceYaml,
    outputDir,
  })
  const zipVersion = hash.slice(0, 7)
  return processGerbers(job, {
    inputDir,
    kitspaceYaml,
    outputDir,
    zipVersion,
    repoFullName,
    plottedGerbers,
  })
}
