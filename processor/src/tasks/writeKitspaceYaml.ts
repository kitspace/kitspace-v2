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
import { s3 } from '../s3.js'

export const outputFiles = ['kitspace-yaml.json'] as const

export interface WriteKitspaceYamlInput {
  kitspaceYamlArray: Array<KitspaceYaml>
}

export default async function writeKitspaceYaml(
  job,
  { kitspaceYamlArray, outputDir }: WriteKitspaceYamlInput & Partial<JobData>,
) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })

  if (await s3.exists(kitspaceYamlJson)) {
    job.updateProgress({ status: 'done', file: kitspaceYamlJson })
    return
  }

  const rendered = await renderKitspaceYamlSummaries(kitspaceYamlArray)

  await s3
    .uploadFileContents(
      kitspaceYamlJson,
      JSON.stringify(rendered, null, 2),
      'application/json',
    )
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
