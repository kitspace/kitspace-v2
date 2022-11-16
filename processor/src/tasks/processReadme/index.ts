import globule from 'globule'
import path from 'node:path'
import fs from 'node:fs/promises'
import { JobData } from '../../jobData.js'
import { S3 } from '../../s3.js'
import { renderMarkdown } from './renderMarkdown.js'

export const outputFiles = ['readme.html'] as const

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
  const processedReadmeHTML = await renderMarkdown({
    rawMarkdown,
    ownerName,
    repoName,
    readmeFolder,
    originalUrl,
    defaultBranch,
  })

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

export default processReadme
