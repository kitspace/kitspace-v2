import slugify from 'slugify'
import path from 'path'

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
  const urlObj = new URL(url)
  return path.basename(urlObj.pathname, path.extname(urlObj.pathname))
}

/**
 * Get the project name from the `path` object in `next.router`.
 * @param projectPath
 * @returns {string}
 * @example
 * // returns 'testUser/cool-project"
 * projectNameFromPath('/testUser/cool-project')
 * @example
 * // returns 'testUser/cool-project"
 * projectNameFromPath('/testUser/cool-project?create=true')
 */
export const projectNameFromPath = projectPath => {
  const pathWithQuery = projectPath.split('/').slice(1).join('/')
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

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Loop until functions returns a truthy value from promise. Alternativley you
 * can provide your own `checkFn` which should return `true` when you want to
 * stop or `false` to continue waiting.
 */

export type WaitForFunction<T> = () => Promise<T>
export type WaitForCheckFunction<T> = (x: T) => boolean
export interface WaitForOptions<T> {
  timeoutMs: number
  interval?: number
  checkFn?: WaitForCheckFunction<T>
}
const defaultCheckFn: WaitForCheckFunction<unknown> = x => Boolean(x)
export async function waitFor<T>(
  fn: WaitForFunction<T>,
  { timeoutMs, interval = 100, checkFn = defaultCheckFn }: WaitForOptions<T>,
): Promise<T | null> {
  const controller = new AbortController()

  const loop = async (): Promise<T> => {
    let r = await fn()
    while (!checkFn(r) && !controller.signal.aborted) {
      await delay(interval)
      r = await fn()
    }
    return r
  }

  const timer = async (): Promise<null> => {
    await delay(timeoutMs)
    controller.abort()
    return null
  }

  return Promise.race([timer(), loop()])
}
