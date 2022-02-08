const path = require('path')
const { writeFile } = require('../utils')

function writeKitspaceYaml(job, { kitspaceYaml, outputDir }) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })

  return writeFile(kitspaceYamlJson, JSON.stringify(kitspaceYaml, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}

module.exports = writeKitspaceYaml
