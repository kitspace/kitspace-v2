import processBOM from './processBOM'
import addToSearch from './addToSearch'

export default async function processInfo(
  job,
  { searchId, inputDir, kitspaceYaml = {}, outputDir, name, hash },
) {
  const bom = await processBOM(job, {
    inputDir,
    kitspaceYaml,
    outputDir,
  })
  return addToSearch(job, { searchId, bom, name, kitspaceYaml, hash })
}
