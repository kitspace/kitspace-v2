const cp = require('child_process')
const util = require('util')
const fs = require('fs')
const path = require('path')
const globule = require('globule')

const { exists } = require('../../utils')

const exec = util.promisify(cp.exec)
const readFile = util.promisify(fs.readFile)

function processIBOM(events, inputDir, kitspaceYaml, outputDir, hash, name) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return _processIBOM(
          events,
          inputDir,
          projectKitspaceYaml,
          projectOutputDir,
          hash,
          projectName,
        )
      }),
    )
  }
  return _processIBOM(events, inputDir, kitspaceYaml, outputDir, hash, name)
}

async function _processIBOM(events, inputDir, kitspaceYaml, outputDir, hash, name) {
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')
  events.emit('in_progress', ibomOutputPath)

  if (await exists(ibomOutputPath)) {
    events.emit('done', ibomOutputPath)
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
    events.emit('failed', ibomOutputPath, { message: 'No PCB file found' })
    return
  }

  const ibomOutputFolder = path.dirname(ibomOutputPath)
  await exec(`mkdir -p ${ibomOutputFolder}`)

  const run_ibom = path.join(__dirname, 'run_ibom')
  await exec(`${run_ibom} '${pcbFile}' '${name}' '${summary}' '${ibomOutputPath}'`)
    .then(() => events.emit('done', ibomOutputPath))
    .catch(e => events.emit('failed', ibomOutputPath, e))
}

async function findBoardFile(path, ext, check) {
  const f = globule.find(`${path}/**/*.` + ext)[0]
  if (check == null || (f != null && (await check(f)))) {
    return f
  }
  return null
}

function checkEagleFile(f) {
  return readFile(f, 'utf8').then(contents => contents.includes('eagle.dtd'))
}

module.exports = processIBOM
