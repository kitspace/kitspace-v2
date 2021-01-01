const cp = require('child_process')
const util = require('util')
const fs = require('fs')
const path = require('path')
const globule = require('globule')

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
  console.log('processing IBOM')
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')
  eventEmitter.emit('in_progress', ibomOutputPath)
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

  console.log('DISPLAY=', process.env.DISPLAY)
  const run_ibom = path.join(__dirname, 'run_ibom')
  const output = await exec(
    `${run_ibom} '${pcbFile}' '${name}' '${summary}' '${ibomOutputPath}'`,
  )
    .then((...args) => ({ ...args }, eventEmitter.emit('done', ibomOutputPath)))
    .catch(e => (e, eventEmitter.emit('failed', ibomOutputPath, e)))

  console.log('run_ibom output', output)
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
