import path from 'node:path'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { JobData } from '../jobData.js'
import { KitspaceYaml } from '../kitspaceYaml.js'
import * as utils from '../utils.js'

export interface WriteKitspaceYamlInput {
  kitspaceYamlArray: Array<KitspaceYaml>
}

export default async function writeKitspaceYaml(
  job,
  { kitspaceYamlArray, outputDir }: WriteKitspaceYamlInput & Partial<JobData>,
) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })

  const rendered = await renderKitspaceYamlSummaries(kitspaceYamlArray)

  return utils
    .writeFile(kitspaceYamlJson, JSON.stringify(rendered, null, 2))
    .then(() => job.updateProgress({ status: 'done', file: kitspaceYamlJson }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: kitspaceYamlJson, error }),
    )
}

async function renderKitspaceYamlSummaries(kitspaceYamlArray: Array<KitspaceYaml>) {
  return Promise.all(
    kitspaceYamlArray.map(async yml => ({
      ...yml,
      summary: await renderSummary(yml.summary),
    })),
  )
}

const Remarker = unified()
  .use(remarkParse)
  .use(remarkEmoji)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify)

async function renderSummary(summary = ''): Promise<string> {
  const rendered = await Remarker.process(summary)
  return String(rendered)
}
