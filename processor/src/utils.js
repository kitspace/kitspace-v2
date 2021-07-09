const fs = require('fs')
const path = require('path')
const util = require('util')
const cp = require('child_process')
const accessPromise = util.promisify(fs.access)

const exec = util.promisify(cp.exec)
const writeFile = fs.promises.writeFile
const readFile = util.promisify(fs.readFile)

function exists(file) {
  return accessPromise(file, fs.constants.F_OK)
    .then(x => x == null)
    .catch(err => {
      if (err.code === 'ENOENT') {
        return false
      } else {
        throw err
      }
    })
}

async function existsAll(paths) {
  let allDoExist = true
  for (const path of paths) {
    allDoExist = allDoExist && (await exists(path))
  }
  return allDoExist
}

function findKicadPcbFile(inputDir, files, kitspaceYaml) {
  if (
    kitspaceYaml.eda &&
    kitspaceYaml.eda.type === 'kicad' &&
    kitspaceYaml.eda.pcb
  ) {
    return path.join(inputDir, kitspaceYaml.eda.pcb)
  } else {
    return files.find(file => file.endsWith('.kicad_pcb'))
  }
}

module.exports = { exists, existsAll, findKicadPcbFile, exec, writeFile, readFile }
