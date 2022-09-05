import * as globule from 'globule'
import * as path from 'path'
import * as superagent from 'superagent'
import * as cheerio from 'cheerio'

import { JobData } from '../jobData'
import { exists, readFile, writeFile } from '../utils'
import { GITEA_URL } from '../env'

async function processReadme(
  job,
  { inputDir, kitspaceYaml, outputDir, ownerName, repoName }: Partial<JobData>,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  if (await exists(readmePath)) {
    job.updateProgress({ status: 'done', file: readmePath })
    return readFile(readmePath, 'utf-8')
  }

  let readmeInputPath

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
  const readmeAsHTML = await renderMarkdown(rawMarkdown)

  const processedReadmeHTML = postProcessMarkdown(readmeAsHTML, ownerName, repoName)

  await writeFile(readmePath, processedReadmeHTML)
    .then(() => job.updateProgress({ status: 'done', file: readmePath }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: readmePath, error }),
    )

  return processedReadmeHTML
}

function findReadmeFile(inputDir) {
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

async function renderMarkdown(rawMarkdown) {
  const giteaMarkdownEndpoint = 'http://gitea:3000/api/v1/markdown/raw'

  const res = await superagent
    .post(giteaMarkdownEndpoint)
    .set('Content-Type', 'application/json')
    .send(rawMarkdown)

  return res.text
}

/**
 * Make urls absolute not relative
 */
function postProcessMarkdown(readmeAsHtml, ownerName, repoName) {
  const $ = cheerio.load(readmeAsHtml)
  $('img').each((_, elem) => {
    const img = $(elem)
    const src = img.attr('src')

    const isRelativeUri = !src.match(/^https?:\/\//)
    if (isRelativeUri) {
      const rawUrl = `${GITEA_URL}/${ownerName}/${repoName}/raw/${src}`
      img.attr('src', rawUrl)
      img.attr('data-cy', 'relative-readme-img')
    }

    // load readme images lazily
    img.attr('loading', 'lazy')
  })

  $('a').each((_, elem) => {
    const a = $(elem)
    const href = a.attr('href')
    if (href.startsWith('/')) {
      const rawUrl = `${GITEA_URL}/${ownerName}/${repoName}/src${href}`
      a.attr('href', rawUrl)
    }
  })

  return $.html()
}

export default processReadme
