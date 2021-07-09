const path = require('path')
const cp = require('child_process')
const util = require('util')
const globule = require('globule')

const { existsAll, findKicadPcbFile } = require('../../utils')
const exec = util.promisify(cp.exec)

function processCAD(
  events,
  inputDir,
  kitspaceYaml,
  outputDir,
  hash,
  name,
  plottedGerbers,
) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(async projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return {
          [projectName]: await _processCAD(
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
  return _processCAD(
    events,
    inputDir,
    kitspaceYaml,
    outputDir,
    hash,
    name,
    plottedGerbers,
  )
}

async function _processCAD(events, inputDir, kitspaceYaml, outputDir) {
  const layoutSvgPath = path.join(outputDir, 'images/layout.svg')

  const filePaths = [layoutSvgPath]

  for (const f of filePaths) {
    events.emit('in_progress', f)
  }

  if (await existsAll(filePaths)) {
    for (const f of filePaths) {
      events.emit('done', f)
    }
    return
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
  const gerberFolder = path.join('/tmp/kitspace', outputDir, 'gerbers')
  await exec(`rm -rf ${gerberFolder} && mkdir -p ${gerberFolder}`)
  const plot_kicad_gerbers = path.join(__dirname, 'plot_kicad_gerbers')
  const plotCommand = `${plot_kicad_gerbers} ${kicadPcbFile} ${gerberFolder}`
  await exec(plotCommand)
  return globule.find(path.join(gerberFolder, '*'))
}

async function plotKicadLayoutSvg(outputDir, layoutSvgPath, kicadPcbFile) {
  const svgFolder = path.join('/tmp/kitspace', outputDir, 'svg')
  await exec(`rm -rf ${svgFolder} && mkdir -p ${svgFolder}`)
  const plot_kicad_layout_svg = path.join(__dirname, 'plot_kicad_layout_svg')
  const plotCommand = `${plot_kicad_layout_svg} ${kicadPcbFile} ${svgFolder}`
  await exec(plotCommand)
  const [svgFile] = globule.find(path.join(svgFolder, '*.svg'))
  if (svgFile == null) {
    throw new Error(`Could not plot .kicad_pcb layout.svg from ${kicadPcbFile}`)
  }
  const layoutSvgFolder = path.dirname(layoutSvgPath)
  await exec(`mkdir -p ${layoutSvgFolder}`)
  // process SVG with scour to make it suitable for kicad-web-viewer
  await exec(`scour -i ${svgFile} -o ${layoutSvgPath} --enable-viewboxing`)
}

module.exports = processCAD
