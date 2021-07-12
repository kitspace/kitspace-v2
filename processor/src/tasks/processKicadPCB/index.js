const path = require('path')
const cp = require('child_process')
const util = require('util')
const globule = require('globule')

const { existsAll, findKicadPcbFile } = require('../../utils')
const exec = util.promisify(cp.exec)

function processKicadPCB(events, inputDir, kitspaceYaml, outputDir) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(async projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return {
          [projectName]: await _processKicadPCB(
            events,
            inputDir,
            projectKitspaceYaml,
            projectOutputDir,
          ),
        }
      }),
    ).then(all =>
      all.reduce(
        (result, plottedGerbers) => ({
          ...result,
          ...plottedGerbers,
        }),
        {},
      ),
    )
  }
  return _processKicadPCB(events, inputDir, kitspaceYaml, outputDir)
}

async function _processKicadPCB(events, inputDir, kitspaceYaml, outputDir) {
  const layoutSvgPath = path.join(outputDir, 'images/layout.svg')

  const filePaths = [layoutSvgPath]

  for (const f of filePaths) {
    events.emit('in_progress', f)
  }

  if (await existsAll(filePaths)) {
    for (const f of filePaths) {
      events.emit('done', f)
    }
    // XXX should really return gerbers here, but they are temp files
    return { inputFiles: {}, gerbers: [] }
  }

  try {
    const files = globule.find(path.join(inputDir, '**'))
    const kicadPcbFile = findKicadPcbFile(inputDir, files, kitspaceYaml)
    if (kicadPcbFile == null) {
      events.emit('failed', layoutSvgPath, Error('No .kicad_pcb file found'))
      return { inputFiles: {}, gerbers: [] }
    }

    const gerbersPromise = plotKicadGerbers(outputDir, kicadPcbFile)

    const layoutPromise = plotKicadLayoutSvg(outputDir, layoutSvgPath, kicadPcbFile)
      .then(() => events.emit('done', layoutSvgPath))
      .catch(e => events.emit('failed', layoutSvgPath, e))

    const gerbers = await gerbersPromise
    await layoutPromise

    const relativeKicadPcbFile = path.relative(inputDir, kicadPcbFile)
    const inputFiles = { [relativeKicadPcbFile]: { type: 'kicad', side: null } }
    return { inputFiles, gerbers }
  } catch (e) {
    for (const f of filePaths) {
      events.emit('failed', f, e)
    }
    return { inputFiles: {}, gerbers: [] }
  }
}

async function plotKicadGerbers(outputDir, kicadPcbFile) {
  const tempGerberFolder = path.join('/tmp/kitspace', outputDir, 'gerbers')
  await exec(`rm -rf ${tempGerberFolder} && mkdir -p ${tempGerberFolder}`)
  const plot_kicad_pcb = path.join(__dirname, 'plot_kicad_pcb')
  const plotCommand = `${plot_kicad_pcb} gerber ${kicadPcbFile} ${tempGerberFolder}`
  await exec(plotCommand)
  return globule.find(path.join(tempGerberFolder, '*'))
}

async function plotKicadLayoutSvg(outputDir, layoutSvgPath, kicadPcbFile) {
  const tempSvgFolder = path.join('/tmp/kitspace', outputDir, 'svg')
  await exec(`rm -rf ${tempSvgFolder} && mkdir -p ${tempSvgFolder}`)
  const plot_kicad_pcb = path.join(__dirname, 'plot_kicad_pcb')
  const plotCommand = `${plot_kicad_pcb} svg ${kicadPcbFile} ${tempSvgFolder} ${layoutSvgPath}`
  return exec(plotCommand)
}

module.exports = processKicadPCB
