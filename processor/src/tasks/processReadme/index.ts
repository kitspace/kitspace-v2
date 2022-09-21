import { unified } from 'unified'
import globule from 'globule'
import path from 'node:path'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'


import {
  exists,
  readFile,
  writeFile
} from '../../utils.js'
import { JobData } from '../../jobData.js'
import urlTransformer from './urlTransformer.js'


async function processReadme(
  job,
  { inputDir, kitspaceYaml, outputDir, ownerName, repoName, originalUrl }: Partial<JobData>,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  // if (await exists(readmePath)) {
  //   job.updateProgress({ status: 'done', file: readmePath })
  //   return readFile(readmePath, 'utf-8')
  // }

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

  const rawMarkdown = await readFile(readmeInputPath, { encoding: 'utf8' })

  const readmeFolder = path.dirname(path.relative(inputDir, readmeInputPath))
  const processedReadmeHTML = await renderMarkdown2(
    rawMarkdown,
    ownerName,
    repoName,
    readmeFolder,
    originalUrl
  )

  await writeFile(readmePath, processedReadmeHTML)
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
      dot: true
    },
  )

  if (readmeFiles.length >= 1) {
    return readmeFiles[0]
  }
  return null
}

async function renderMarkdown2(rawMarkdown: string, ownerName: string, repoName: string,
  readmeFolder: string, originalUrl: string) {
  const Remarker = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(urlTransformer, { readmeFolder, originalUrl, ownerName, repoName })
    .use(rehypeSanitize)
    .use(rehypeStringify)

  const processedMarkdown = await Remarker.process(rawMarkdown)
  return String(processedMarkdown)
}

export default processReadme
