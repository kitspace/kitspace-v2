import slugify from 'slugify'
import path from 'path'
import { groupBy, zip } from 'lodash'
import { matcher } from 'micromatch'
import cheerio from 'cheerio'

import { getFileRawContent, renderMarkdown } from './giteaApi'

const giteaUrl = process.env.KITSPACE_GITEA_URL

/**
 * Look in project files and choose a file name for the project from it.
 * First it looks for known PCB CAD generate files,
 * if none is found returns the first uploaded file.
 * @param files{[]}
 * @returns {string}
 * @example
 * // returns 'my-cool-project'
 * slugifiedNameFromFiles([{name: 'f1.png', size: 1024, last_modified: {DATE}},
 *                         {name: 'f2.md', size: 1024, last_modified: {DATE}},
 *                         {name: 'my cool project.pro', size: 1024, last_modified: {DATE}}])
 */
export const slugifiedNameFromFiles = files => {
  const FilesNames = files.map(f => f.name)
  // TODO: make this look for all PCB software generated files not just KiCad projects
  const kicadProject = FilesNames.find(f => f.endsWith('.pro'))
  const projectWithExt = kicadProject || FilesNames[0]
  return slugify(projectWithExt.split('.')[0])
}

/**
 * find readme file in a repo under a path(default root `/`)
 * @param {Array<object>} repoFiles list of file names to search
 * @param {string=} path a path(gitea path) to search into, if not passed searches repo path.
 * @returns {string} the readme file name if found and an empty string if no readme file were found.
 */
export const findReadme = (repoFiles, path) => {
  // TODO: implement path search.
  /**
   * @type {string[]}
   */
  const filesNames = repoFiles.map(f => f.name)
  const isMatch = matcher('readme?(.markdown|.mdown|.mkdn|.md|.rst)', {
    nocase: true,
  })
  // Find the first matching file index
  const fileIndex = filesNames.map(f => isMatch(f)).indexOf(true)

  return fileIndex !== -1 ? filesNames[fileIndex] : ''
}

/**
 * convert readme to html and convert urls to absolute urls.
 * @param {string} repo
 * @param {string} readmeFile
 * @returns {Promise<string>} the content of readme file as html
 */
export const renderReadme = async (repo, readmeFile) => {
  // TODO handle `rst` case.
  const readmeContent = await getFileRawContent(repo, readmeFile)
  const readmeAsHtml = await renderMarkdown(readmeContent)

  // Replace relative urls with absolute ones for `img` and `a` tags.
  const $ = cheerio.load(readmeAsHtml)
  $('img').each((_, elem) => {
    const img = $(elem)
    const src = img.attr('src')

    if (src.startsWith('/')) {
      const rawUrl = `${giteaUrl}/${repo}/raw${src}`
      img.attr('src', rawUrl)
    }
  })

  $('a').each((_, elem) => {
    const a = $(elem)
    const href = a.attr('href')
    if (href.startsWith('/')) {
      const rawUrl = `${giteaUrl}/${repo}/src${href}`
      a.attr('href', rawUrl)
    }
  })

  return $.html()
}

/**
 * Get the content of A DataURL as a blob
 * @param base64{string}
 * @returns {Promise<Promise<Blob>>}
 */
export const b64toBlob = base64 => fetch(base64).then(res => res.blob())

/**
 * Get the repo name from its url
 * @param url
 * @returns {string}
 * @example
 * // returns 'ulx3s'
 * urlToName('https://github.com/emard/ulx3s/')
 */
export const urlToName = url => {
  url = new URL(url)
  return path.basename(url.pathname, path.extname(url.pathname))
}

/**
 * Get the project name from the `path` object in `next.router`.
 * @param path
 * @returns {string}
 * @example
 * // returns 'testUser/cool-project"
 * projectNameFromPath('/testUser/cool-project')
 * @example
 * // returns 'testUser/cool-project"
 * projectNameFromPath('/testUser/cool-project?create=true')
 */
export const projectNameFromPath = path => {
  const pathWithQuery = path.split('/').slice(1).join('/')
  // In case if there's a query string remove it
  return pathWithQuery.split('?')[0]
}

/**
 * A promise based file reader, reads a file as DataURL{string}
 * @param file
 * @returns {Promise<string>}
 */
export const readFileContent = file =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result
      resolve(content)
    }
    reader.readAsDataURL(file)
  })

/**
 * Convert Megabytes to bytes
 * @param megs{string}
 * @example
 * // returns 1048576
 * MBytesToBytes('1M')
 */
export const MBytesToBytes = megs => {
  const num = Number(megs.split('M')[0])

  // 1 Megabyte = 1048576 Bytes.
  return 1048576 * num
}
