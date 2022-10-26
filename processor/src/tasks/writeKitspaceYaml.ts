import path from 'node:path'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { JobData } from '../jobData.js'
import { S3 } from '../s3.js'


export default async function writeKitspaceYaml(
  job,
  { kitspaceYaml, outputDir }: Partial<JobData>,
  s3: S3,
) {
  const kitspaceYamlJson = path.join(outputDir, 'kitspace-yaml.json')
  job.updateProgress({ status: 'in_progress', file: kitspaceYamlJson })

  if (await s3.exists(kitspaceYamlJson)) {
    job.updateprogress({ status: 'done', file: kitspaceYamlJson })
    return
  }

  const rendered = await renderKitspaceYamlSummaries(kitspaceYaml)

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

async function renderKitspaceYamlSummaries(kitspaceYaml) {
  if (kitspaceYaml.multi) {
    const rendered = { multi: {} }
    for (const key of Object.keys(kitspaceYaml.multi)) {
      const subProject = kitspaceYaml.multi[key]
      rendered.multi[key] = {
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
  .use(rehypeSanitize)
  .use(rehypeStringify)

async function renderSummary(summary = ''): Promise<string> {
  const rendered = await Remarker.process(summary)
  return String(rendered)
}
