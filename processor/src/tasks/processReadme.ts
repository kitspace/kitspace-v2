import * as globule from 'globule'
import * as path from 'path'
import * as superagent from 'superagent'
import * as cheerio from 'cheerio'

import { exists, readFile, writeFile } from '../utils'
import { GITEA_URL } from '../env'

async function processReadme(
  job,
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  { inputDir, kitspaceYaml = {}, outputDir, name }: any,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  if (await exists(readmePath)) {
    job.updateProgress({ status: 'done', file: readmePath })
    return
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
      return
    }
    readmeInputPath = readmeFile
  }

  const rawMarkdown = await readFile(readmeInputPath, { encoding: 'utf8' })
  const readmeAsHTML = await renderMarkdown(rawMarkdown)

  const renderedReadme = postProcessMarkdown(readmeAsHTML, name)

  await writeFile(readmePath, renderedReadme)
    .then(() => job.updateProgress({ status: 'done', file: readmePath }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: readmePath, error }),
    )
}

function findReadmeFile(inputDir) {
  const readmeFiles = globule.find(
    path.join(inputDir, 'readme?(.markdown|.mdown|.mkdn|.md|.rst)'),
    {
      nocase: true,
    },
  )

  if (readmeFiles.length >= 1) {
    return readmeFiles[0]
  }
  return null
}

async function renderMarkdown(rawMarkdown) {
  const giteaMarkdownEndpoint = 'http://gitea:3000/api/v1/markdown/raw'

  const res = await superagent.post(giteaMarkdownEndpoint)
    .set('Content-Type', 'application/json')
    .send(rawMarkdown)

  return res.text
}

/**
 * Make urls absolute not relative
 * @param {string} readmeAsHtml
 * @param {string} projectFullname
 * @returns {string}
 */
function postProcessMarkdown(readmeAsHtml, projectFullname) {
  const $ = cheerio.load(readmeAsHtml)
  $('img').each((_, elem) => {
    const img = $(elem)
    const src = img.attr('src')

    const isRelativeUri = !src.match(/https?:\/\//)
    if (isRelativeUri) {
      const rawUrl = `${GITEA_URL}/${projectFullname}/raw/${src}`
      img.attr('src', rawUrl)
    }

    // load readme images lazily
    img.attr('loading', 'lazy')
  })

  $('a').each((_, elem) => {
    const a = $(elem)
    const href = a.attr('href')
    if (href.startsWith('/')) {
      const rawUrl = `${GITEA_URL}/${projectFullname}/src${href}`
      a.attr('href', rawUrl)
    }
  })

  return $.html()
}

export default processReadme
