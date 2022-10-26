import globule from 'globule'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeShiftHeading from 'rehype-shift-heading'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkEmoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { JobData } from '../../jobData.js'
import { S3 } from '../../s3.js'
import urlTransformer, { rehypeSanitizeOpts } from './urlTransformer.js'

async function processReadme(
  job,
  {
    inputDir,
    kitspaceYaml,
    outputDir,
    ownerName,
    repoName,
    originalUrl,
    defaultBranch,
  }: Partial<JobData>,
  s3: S3,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  if (await s3.exists(readmePath)) {
    job.updateProgress({ status: 'done', file: readmePath })
    return s3.getFileContents(readmePath)
  }

  let readmeInputPath: string

  if (kitspaceYaml.readme) {
    readmeInputPath = path.join(inputDir, kitspaceYaml.readme)
  } else {
    const readmeFile = findReadmeFile(inputDir)
    if (readmeFile === null) {
      job.updateProgress({
        status: 'failed',
        file: readmePath,
        error: Error("couldn't find readme file"),
      })
      return ''
    }
    readmeInputPath = readmeFile
  }

  const rawMarkdown = await fs.readFile(readmeInputPath, { encoding: 'utf8' })

  const readmeFolder = path.dirname(path.relative(inputDir, readmeInputPath))
  const processedReadmeHTML = await renderMarkdown(
    rawMarkdown,
    ownerName,
    repoName,
    readmeFolder,
    originalUrl,
    defaultBranch,
  )

  s3.uploadFileContents(readmePath, processedReadmeHTML, 'text/html')
    .then(() => job.updateProgress({ status: 'done', file: readmePath }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: readmePath, error }),
    )

  return processedReadmeHTML
}

function findReadmeFile(inputDir: string) {
  const readmeFiles = globule.find(
    path.join(inputDir, 'readme?(.markdown|.mdown|.mkdn|.md|.rst)'),
    {
      nocase: true,
      dot: true,
    },
  )

  if (readmeFiles.length >= 1) {
    return readmeFiles[0]
  }
  return null
}

async function renderMarkdown(
  rawMarkdown: string,
  ownerName: string,
  repoName: string,
  readmeFolder: string,
  originalUrl: string,
  defaultBranch: string,
) {
  const Remarker = unified()
    .use(remarkParse)
    .use(remarkEmoji)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(urlTransformer, {
      readmeFolder,
      originalUrl,
      ownerName,
      repoName,
      defaultBranch,
    })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeShiftHeading, { shift: 1 })
    .use(rehypeHighlight)
    .use(rehypeSanitize, rehypeSanitizeOpts)
    .use(rehypeStringify)

  const processedMarkdown = await Remarker.process(rawMarkdown)
  return String(processedMarkdown)
}

export default processReadme
