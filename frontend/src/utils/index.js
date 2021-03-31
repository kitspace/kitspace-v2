import slugify from 'slugify'
import path from 'path'
import { groupBy, zip } from 'lodash'

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
export const readFileContent = file => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = reader.result
      resolve(content)
    }
    reader.readAsDataURL(file)
  })
}

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

/**
 * Takes an []File zipped with their UUIDs on Gitea []String
 * returns the UUIDs grouped by path
 * @param filesZipUUIDs{Array.<[File, String]>}
 * @returns {Object}
 */
export const groupByPath = filesZipUUIDs => {
  const pathZipUUIDs = filesZipUUIDs.map(([f, uuid]) => {
    const p = f.path
    // Drag'nDrop result in absolute file paths `/{Top level dir}/...`,
    // while choosing from file selector result in to relative paths `{Top level dir}/...`
    // normalize Drag'nDrop to be like file selector
    const normPath = p.startsWith('/') ? p.substring(1) : p
    return [normPath, uuid]
  })

  const UUIDsGroupedByPath = groupBy(
    pathZipUUIDs,
    ([path, _]) =>
      path
        .split('/') // According to the browser API the file separator is always '/' even on Windows
        .slice(1, -1) // Group by path, so the top level directory and  the file name should be ignored
        .join('/'), // Reconstruct the file path once again, Gitea expects '/' as a separator
  )

  const paths = Object.keys(UUIDsGroupedByPath)
  const uuids = Object.values(UUIDsGroupedByPath).map(f =>
    f.map(([_, uuid]) => uuid),
  )

  return Object.fromEntries(zip(paths, uuids))
}
