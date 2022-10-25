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
 * !if `url` is invalid the form validation would have caught it
 * @param url
 * @returns {string}
 * @example
 * // returns 'ulx3s'
 * urlToName('https://github.com/emard/ulx3s/')
 */
export const urlToName = url => {
  try {
    url = new URL(url)
  } catch {
    return ''
  }
  return path.basename(url.pathname, path.extname(url.pathname))
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

export type WaitForFunction<T> = () => Promise<T>
export type WaitForCheckFunction<T> = (x: T) => boolean
export interface WaitForOptions<T> {
  timeoutMs: number
  intervalMs?: number
  checkFn?: WaitForCheckFunction<T>
}
const defaultCheckFn: WaitForCheckFunction<unknown> = x => Boolean(x)

/**
 * Retry function until it returns a promise that resolves to a truthy value.
 * Alternatively you can provide your own `checkFn` which should return `true`
 * when you want to stop or `false` to continue retrying.
 */
export function waitFor<T>(
  fn: WaitForFunction<T>,
  { timeoutMs, intervalMs = 1000, checkFn = defaultCheckFn }: WaitForOptions<T>,
): Promise<T | null> {
  const controller = new AbortController()

  const loop = async (): Promise<T> => {
    let r = await fn()
    while (!checkFn(r) && !controller.signal.aborted) {
      await delay(intervalMs)
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
/**
 * format projectName name as a valid gitea repo name.
 * This replaces any **non* (alphanumeric, -, _, and .) with a '-',
 * see https://github.com/go-gitea/gitea/blob/b59b0cad0a550223f74add109ff13c0d2f4309f3/services/forms/repo_form.go#L35
 * @param projectName {string}
 */
export const formatAsGiteaRepoName = projectName =>
  projectName.replace(/[^\w\d-_.]/g, '-').slice(0, 100)
