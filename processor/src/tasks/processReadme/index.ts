import globule from 'globule'
import path from 'node:path'
import fs from 'node:fs/promises'
import { Job, ProjectJobData } from '../../job.js'
import * as s3 from '../../s3.js'
import { renderMarkdown } from './renderMarkdown.js'

export const outputFiles = ['readme.html'] as const

async function processReadme(
  job: Job,
  {
    inputDir,
    kitspaceYaml,
    outputDir,
    ownerName,
    repoName,
    originalUrl,
    defaultBranch,
  }: Partial<ProjectJobData>,
): Promise<string | null> {
  const readmePath = path.join(outputDir, 'readme.html')

  await job.updateProgress({ status: 'in_progress', file: readmePath, outputDir })

  if (await s3.exists(readmePath)) {
    await job.updateProgress({ status: 'done', file: readmePath, outputDir })
    return s3.getFileContents(readmePath)
  }

  let processedReadmeHTML = null

  try {
    let readmeInputPath: string
    if (kitspaceYaml.readme) {
      readmeInputPath = path.join(inputDir, kitspaceYaml.readme)
    } else {
      const readmeFile = findReadmeFile(inputDir)
      if (readmeFile === null) {
        await job.updateProgress({
          status: 'failed',
          file: readmePath,
          error: Error("couldn't find readme file"),
          outputDir,
        })
        return ''
      }
      readmeInputPath = readmeFile
    }

    const rawMarkdown = await fs.readFile(readmeInputPath, { encoding: 'utf8' })

    const readmeFolder = path.dirname(path.relative(inputDir, readmeInputPath))
    processedReadmeHTML = await renderMarkdown({
      rawMarkdown,
      ownerName,
      repoName,
      readmeFolder,
      originalUrl,
      defaultBranch,
    })
  } catch (error) {
    await job.updateProgress({
      status: 'failed',
      file: readmePath,
      error,
      outputDir,
    })
  }

  s3.uploadFileContents(readmePath, processedReadmeHTML, 'text/html')
    .then(() => job.updateProgress({ status: 'done', file: readmePath, outputDir }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: readmePath, error, outputDir }),
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
