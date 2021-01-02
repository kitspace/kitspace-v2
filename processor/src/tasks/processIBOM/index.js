const cp = require('child_process')
const util = require('util')
const fs = require('fs')
const path = require('path')
const globule = require('globule')

const { exists } = require('../../utils')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)

async function processIBOM(
  eventEmitter,
  inputDir,
  kitspaceYaml,
  outputDir,
  hash,
  name,
) {
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')
  eventEmitter.emit('in_progress', ibomOutputPath)

  if (await exists(ibomOutputPath)) {
    eventEmitter.emit('done', ibomOutputPath)
    return
  }

  const summary = kitspaceYaml.summary || ''

  let pcbFile
  if (
    kitspaceYaml.eda &&
    (kitspaceYaml.eda.type === 'kicad' || kitspaceYaml.eda.type === 'eagle') &&
    kitspaceYaml.eda.pcb != null
  ) {
    pcbFile = path.join(inputDir, kitspaceYaml.eda.pcb)
  } else if (kitspaceYaml.eda == null) {
    pcbFile = await findBoardFile(inputDir, 'kicad_pcb')
  }
  if (pcbFile == null) {
    pcbFile = await findBoardFile(inputDir, 'brd', checkEagleFile)
  }

  if (pcbFile == null) {
    eventEmitter.emit('failed', ibomOutputPath, { message: 'No PCB file found' })
    return
  }

  const run_ibom = path.join(__dirname, 'run_ibom')
  await exec(`${run_ibom} '${pcbFile}' '${name}' '${summary}' '${ibomOutputPath}'`)
    .then(() => eventEmitter.emit('done', ibomOutputPath))
    .catch(e => eventEmitter.emit('failed', ibomOutputPath, e))
}

async function findBoardFile(path, ext, check) {
  let f = globule.find(`${path}/**/*.` + ext)[0]
  if (check == null || (f != null && (await check(f)))) {
    return f
  }
  return null
}

function checkEagleFile(f) {
  return readFile(f, 'utf8').then(contents => contents.includes('eagle.dtd'))
}

module.exports = processIBOM
