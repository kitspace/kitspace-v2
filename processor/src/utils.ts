import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import cp, { ProcessEnvOptions } from 'node:child_process'
import shellEscape from 'shell-escape'

const accessPromise = util.promisify(fs.access)

export const exec = util.promisify(cp.exec)
export const execEscaped = (args: string[], options?: ProcessEnvOptions) =>
  util.promisify(cp.exec)(shellEscape(args), options)
export const { writeFile } = fs.promises
export const readFile = util.promisify(fs.readFile)

export function exists(file) {
  return accessPromise(file, fs.constants.F_OK)
    .then(x => x == null)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false
      }
      throw err
    })
}

export async function existsAll(paths) {
  let allDoExist = true
  for (const p of paths) {
    allDoExist = allDoExist && (await exists(p))
  }
  return allDoExist
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export function findKicadPcbFile(inputDir, files, kitspaceYaml) {
  if (
    kitspaceYaml.eda &&
    kitspaceYaml.eda.type === 'kicad' &&
    kitspaceYaml.eda.pcb
  ) {
    return path.join(inputDir, kitspaceYaml.eda.pcb)
  }
  return files.find(file => file.endsWith('.kicad_pcb'))
}

export function findKicadSchematic(inputDir, files, kitspaceYaml) {
  if (kitspaceYaml.eda && kitspaceYaml.eda.type === 'kicad') {
    const { pcb } = kitspaceYaml.eda
    const sch = kitspaceYaml.eda.schematic || pcb.replace(/\.kicad_pcb$/, '.sch')
    return path.join(inputDir, sch)
  }
  // since there can be more than one .sch, better to find the .pro and
  // deduce the schematic file from that
  const pro = files.find(file => file.endsWith('.pro'))
  if (pro != null) {
    return pro.replace(/\.pro/, '.sch')
  }
  return files.find(file => file.endsWith('.sch'))
}

export function isRelativeUrl(uri: string) {
  return !uri.match(/^https?:\/\//)
}

export function normalizeRelativeUrl(url: string, rootFolder: string) {
  if (url.startsWith('/')) {
    return url.slice(1)
  }
  return path.join(rootFolder, url)
}

export function toGitHubRawUrl(url: string) {
  const parsedUrl = new URL(url)

  if (parsedUrl.hostname === 'github.com') {
    parsedUrl.hostname = 'raw.githubusercontent.com'
    const urlPath = parsedUrl.pathname.split('/')
    // Avoid modifying github actions status badges.
    const isWorkflowPath = ['workflows', 'actions'].includes(urlPath?.[3])

    if (!isWorkflowPath) {
      // Remove `/blob/` or '/raw/' from the path.
      parsedUrl.pathname = urlPath.slice(0, 3).concat(urlPath.slice(4)).join('/')
      url = parsedUrl.toString()
    }
  }
  return url
}
