import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as cp from 'child_process'

const accessPromise = util.promisify(fs.access)

export const exec = util.promisify(cp.exec)
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
