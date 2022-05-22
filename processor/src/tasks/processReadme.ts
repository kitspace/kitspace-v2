import * as cheerio from 'cheerio'
import { marked } from 'marked'
import path from 'node:path'
import globule from 'globule'


import { JobData } from '../jobData.js'
import { readFile, writeFile } from '../utils.js'
import { GITEA_URL } from '../env.js'

const MARKED_OPTS: marked.MarkedOptions = {
  async: true,
  gfm: true,
  breaks: true,
  headerIds: true,
  silent: true,
  smartLists: true,
}

async function processReadme(
  job,
  { inputDir, kitspaceYaml, outputDir, ownerName, repoName }: Partial<JobData>,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  // if (await exists(readmePath)) {
  //   job.updateProgress({ status: 'done', file: readmePath })
  //   return readFile(readmePath, 'utf-8')
  // }

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
  // const readmeAsHTML = await renderMarkdown(rawMarkdown)

  const readmeFolder = path.dirname(path.relative(inputDir, readmeInputPath))
  const readmeAsHTML = await renderMarkdown(rawMarkdown, ownerName, repoName, readmeFolder)

  const processedReadmeHTML = readmeAsHTML
  // const processedReadmeHTML = postProcessMarkdown(
  //   readmeAsHTML,
  //   ownerName,
  //   repoName,
  //   readmeFolder,
  // )

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

const Renderer = new marked.Renderer(MARKED_OPTS)

function ImageRenderer(baseUrl: string, readmeFolder: string) {
  return (href: string, title: string, text: string) => {
    const isRelativeUri = !href.match(/^https?:\/\//)
    if (isRelativeUri) {
      if (href.startsWith('/')) {
        href = href.slice(1)
      } else {
        href = path.join(readmeFolder, href)
      }
      href = `${baseUrl}/${href}`
    } else {
      href = toRawUrl(href)
    }

    return `<img src="${href}" loading="lazy" data-cy="relative-readme-img" alt="${text}" title="${title}">`
  }
}

async function renderMarkdown(rawMarkdown: string, ownerName: string, repoName: string, readmeFolder: string) {
  const baseUrl = `${GITEA_URL}/${ownerName}/${repoName}/raw`

  Renderer.image = ImageRenderer(baseUrl, readmeFolder)

  return marked(rawMarkdown, { renderer: Renderer })
}

function toRawUrl(url: string) {

  const hostName = new URL(url).hostname
  switch (hostName) {
    case 'github.com':
      url = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob', '')
      break
    default:
      break
  }
  return url
}

/**
 * Make urls absolute not relative
 */
function postProcessMarkdown(readmeAsHtml: string, ownerName: string, repoName: string, readmeFolder: string) {
  const $ = cheerio.load(readmeAsHtml)
  $('img').each((_, elem) => {
    const img = $(elem)
    let src = img.attr('src')

    const isRelativeUri = !src.match(/^https?:\/\//)
    if (isRelativeUri) {
      if (src.startsWith('/')) {
        src = src.slice(1)
      } else {
        src = path.join(readmeFolder, src)
      }
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
