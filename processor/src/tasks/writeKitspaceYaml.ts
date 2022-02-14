import path from 'path'
import * as utils from '../utils'

export default function writeKitspaceYaml(job, { kitspaceYaml = {}, outputDir }) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })

  return utils.writeFile(kitspaceYamlJson, JSON.stringify(kitspaceYaml, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}
