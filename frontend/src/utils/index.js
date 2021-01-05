import slugify from 'slugify'
import path from 'path'

/**
 * Look in project files and choose a file name for the project from it,
 * @param files{[]}
 * @returns {string}
 */
export const slugifiedNameFromFiles = files => {
  const FilesNames = files.map(f => f.name)
  // TODO: make this look for all PCB software generated files not just KiCad projects
  const kicadProject = FilesNames.find(f => f.endsWith('.pro'))
  const projectWithExt = kicadProject || FilesNames[0]
  return slugify(projectWithExt.split('.')[0])
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
 */
export const urlToName = url => {
  url = new URL(url)
  return path.basename(url.pathname, path.extname(url.pathname))
}

/**
 * Get the project name from the `path` object in `next.router`.
 * @param path
 * @returns {*}
 */
export const projectNameFromPath = path => {
  return path.split('/').slice(3).join('/')
}
