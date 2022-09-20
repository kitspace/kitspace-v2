import { marked } from 'marked'
import path from 'node:path'
import globule from 'globule'


import { GITEA_URL } from '../env.js'
import {
  exists,
  isRelativeUrl,
  normalizeRelativeUrl,
  readFile,
  toGitHubRawUrl,
  writeFile
} from '../utils.js'
import { JobData } from '../jobData.js'

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
  { inputDir, kitspaceYaml, outputDir, ownerName, repoName, originalUrl }: Partial<JobData>,
) {
  const readmePath = path.join(outputDir, 'readme.html')

  job.updateProgress({ status: 'in_progress', file: readmePath })

  if (await exists(readmePath)) {
    job.updateProgress({ status: 'done', file: readmePath })
    return readFile(readmePath, 'utf-8')
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

  const rawMarkdown = await readFile(readmeInputPath, { encoding: 'utf8' })

  const readmeFolder = path.dirname(path.relative(inputDir, readmeInputPath))
  const processedReadmeHTML = await renderMarkdown(
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

function ImageRenderer(baseUrl: string, readmeFolder: string) {
  return (href: string, title: string, text: string) => {
    if (isRelativeUrl(href)) {
      href = normalizeRelativeUrl(href, readmeFolder)
      href = `${baseUrl}/${href}`
    } else {
      href = toGitHubRawUrl(href)
    }

    return `<img src="${href}" loading="lazy" data-cy="relative-readme-img" alt="${text}" title="${title || text}">`
  }
}


function UrlRenderer(readmeFolder: string, originalUrl: string) {
  return (href: string, title: string, text: string) => {
    if (isRelativeUrl(href)) {
      href = normalizeRelativeUrl(href, readmeFolder)
      // the `/-/` is equivalent to `/HEAD/` but works for both GitHub and GitLab.
      const rawUrl = `${originalUrl}/blob/-/${href}`
      href = rawUrl
    }
    return `<a href=${href} target="_blank" rel="noopener noreferrer">${text}</a>`
  }
}


async function renderMarkdown(
  rawMarkdown: string,
  ownerName: string,
  repoName: string,
  readmeFolder: string,
  originalUrl: string) {
  const baseUrl = `${GITEA_URL}/${ownerName}/${repoName}/raw`
  const Renderer = new marked.Renderer(MARKED_OPTS)

  Renderer.image = ImageRenderer(baseUrl, readmeFolder)
  Renderer.link = UrlRenderer(readmeFolder, originalUrl)

  return marked(rawMarkdown, { renderer: Renderer })
}

export default processReadme
