const processGerbers = require('./processGerbers')
const processKicadPCB = require('./processKicadPCB')

async function processPCB(
  job,
  { inputDir, kitspaceYaml, outputDir, hash, name },
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
    name,
    plottedGerbers,
  })
}

module.exports = processPCB
