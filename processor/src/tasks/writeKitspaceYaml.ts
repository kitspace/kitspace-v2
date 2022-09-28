import escape from 'escape-html'
import LinkifyIt from 'linkify-it'
import path from 'node:path'

import { JobData } from '../jobData.js'
import * as utils from '../utils.js'

const linkify = new LinkifyIt()

export default function writeKitspaceYaml(
  job,
  { kitspaceYaml, outputDir }: Partial<JobData>,
) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })
  const KitspaceYamlJsonLinkified = linkifyKitspaceYaml(kitspaceYaml)

  return utils
    .writeFile(kitspaceYamlJson, JSON.stringify(KitspaceYamlJsonLinkified, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}

function linkifyKitspaceYaml(kitspaceYaml) {
  if (kitspaceYaml.multi) {
    const linkifiedKitspaceYaml = kitspaceYaml
    Object.keys(kitspaceYaml.multi).forEach(subProject => {
      linkifiedKitspaceYaml.multi[subProject] = linkifyProjectSummary(kitspaceYaml.multi[subProject])
    })
    return linkifiedKitspaceYaml
  }

  return linkifyProjectSummary(kitspaceYaml)
}

function linkifyProjectSummary(kitspaceYaml) {
  let escapedSummary = escape(kitspaceYaml.summary || '')
  const matches = linkify.match(escapedSummary)

  if (matches) {
    for (const match of matches) {
      // Use https by default
      const url = new URL(match.url)
      if (!match.schema) {
        url.protocol = 'https:'
      }

      escapedSummary = escapedSummary.replace(
        match.raw,
        `<a href="${url.toString()}" rel="noopener noreferrer" target="_blank">${match.text}</a>`
      )
    }
  }

  kitspaceYaml.summary = escapedSummary
  return kitspaceYaml
}
