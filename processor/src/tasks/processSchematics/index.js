const path = require('path')
const globule = require('globule')
const log = require('loglevel')

const { existsAll, exec, findKicadSchematic } = require('../../utils')

function processSchematics(events, inputDir, kitspaceYaml, outputDir) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return _processSchematics(
          events,
          inputDir,
          projectKitspaceYaml,
          projectOutputDir,
        )
      }),
    )
  }
  return _processSchematics(events, inputDir, kitspaceYaml, outputDir)
}

async function _processSchematics(events, inputDir, kitspaceYaml, outputDir) {
  const schematicSvgPath = path.join(outputDir, 'images/schematic.svg')

  const filePaths = [schematicSvgPath]

  for (const f of filePaths) {
    events.emit('in_progress', f)
  }

  if (await existsAll(filePaths)) {
    for (const f of filePaths) {
      events.emit('done', f)
    }
  }

  try {
    const files = globule.find(path.join(inputDir, '**'))
    const topLevelSchematic = findKicadSchematic(inputDir, files, kitspaceYaml)
    if (topLevelSchematic == null) {
      events.emit('failed', schematicSvgPath, Error('No .sch file found'))
      return
    }

    await plotKicadSchematic(schematicSvgPath, topLevelSchematic)
      .then(() => events.emit('done', schematicSvgPath))
      .catch(e => events.emit('failed', schematicSvgPath, e))

  } catch (e) {
    log.error(e)
    for (const f of filePaths) {
      events.emit('failed', f, e)
    }
  }
}

async function plotKicadSchematic(outputSvgPath, schematicPath) {
  const outputFolder = path.dirname(outputSvgPath)
  const tempFolder = path.join('/tmp/kitspace', outputFolder, 'schematics')
  await exec(`rm -rf ${tempFolder} && mkdir -p ${tempFolder}`)
  await exec(`eeschema_do export -f svg '${schematicPath}' '${tempFolder}'`)
  const [tempSvg] = globule.find(path.join(tempFolder, '*.svg'))
  if (tempSvg == null) {
    throw Error('Could not process KiCad .sch file')
  }
  await exec(`mkdir -p ${outputFolder}`)
  await exec(`mv ${tempSvg} ${outputSvgPath}`)
}

module.exports = processSchematics
