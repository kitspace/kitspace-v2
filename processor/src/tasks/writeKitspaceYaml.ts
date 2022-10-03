import path from 'node:path'

import { unified } from 'unified'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'

import { JobData } from '../jobData.js'
import * as utils from '../utils.js'


export default async function writeKitspaceYaml(
  job,
  { kitspaceYaml, outputDir }: Partial<JobData>,
) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })
  const KitspaceYamlJsonLinkified = await linkifyKitspaceYaml(kitspaceYaml)

  return utils
    .writeFile(kitspaceYamlJson, JSON.stringify(KitspaceYamlJsonLinkified, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}

async function linkifyKitspaceYaml(kitspaceYaml) {
  if (kitspaceYaml.multi) {
    const linkifiedKitspaceYaml = kitspaceYaml
    Object.keys(kitspaceYaml.multi).forEach(async subProject => {
      linkifiedKitspaceYaml.multi[subProject] = await renderProjectSummary(kitspaceYaml.multi[subProject])
    })
    return linkifiedKitspaceYaml
  }
  return renderProjectSummary(kitspaceYaml)
}

async function renderProjectSummary(kitspaceYaml) {
  const summary = kitspaceYaml.summary || ''
  const Remarker = unified()
    .use(remarkParse)
    .use(remarkEmoji)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeSanitize)
    .use(rehypeStringify)

  const processedMarkdown = await Remarker.process(summary)
  kitspaceYaml.summary = String(processedMarkdown)
  return kitspaceYaml
}
