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

  const rendered = await renderKitspaceYamlSummaries(kitspaceYaml)

  return utils
    .writeFile(kitspaceYamlJson, JSON.stringify(rendered, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}

async function renderKitspaceYamlSummaries(kitspaceYaml) {
  if (kitspaceYaml.multi) {
    const rendered = { multi: {} }
    for (const key of kitspaceYaml.multi) {
      const subProject = kitspaceYaml.multi[key]
      rendered.multi[subProject] = {
        ...subProject,
        summary: await renderSummary(subProject.summary),
      }
    }
    return rendered
  }
  return { ...kitspaceYaml, summary: await renderSummary(kitspaceYaml.summary) }
}

const Remarker = unified()
  .use(remarkParse)
  .use(remarkEmoji)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeSanitize)
  .use(rehypeStringify)

async function renderSummary(summary = ''): Promise<string> {
  const rendered = await Remarker.process(summary)
  return String(rendered)
}
