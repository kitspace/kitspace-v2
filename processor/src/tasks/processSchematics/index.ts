import * as path from 'path'
import * as globule from 'globule'
import log from 'loglevel'

import { existsAll, exec, findKicadSchematic } from '../../utils'

async function processSchematics(job, { inputDir, kitspaceYaml = {}, outputDir }) {
  const schematicSvgPath = path.join(outputDir, 'images/schematic.svg')

  const filePaths = [schematicSvgPath]

  for (const file of filePaths) {
    job.updateProgress({ status: 'in_progress', file })
  }

  if (await existsAll(filePaths)) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'done', file })
    }
  }

  try {
    const files = globule.find(path.join(inputDir, '**'))
    const topLevelSchematic = findKicadSchematic(inputDir, files, kitspaceYaml)
    if (topLevelSchematic == null) {
      job.updateProgress({
        status: 'failed',
        file: schematicSvgPath,
        error: Error('No .sch file found'),
      })
      return
    }

    await plotKicadSchematic(schematicSvgPath, topLevelSchematic)
      .then(() => job.updateProgress({ status: 'done', file: schematicSvgPath }))
      .catch(error =>
        job.updateProgress({ status: 'failed', file: schematicSvgPath, error }),
      )
  } catch (error) {
    log.error(error)
    for (const file of filePaths) {
      job.updateProgress({ status: 'failed', file, error })
    }
  }
}

async function plotKicadSchematic(outputSvgPath, schematicPath) {
  const outputFolder = path.dirname(outputSvgPath)
  // tempFolder needs to be in shared /data volume as we are using the outer
  // docker daemon for docker in docker
  const tempFolder = path.join('/data/temp/kitspace', outputFolder, 'schematics')
  await exec(`rm -rf ${tempFolder} && mkdir -p ${tempFolder}`)
  const plot_kicad_sch_docker = path.join(__dirname, 'plot_kicad_sch_docker')
  const r = await exec(
    `${plot_kicad_sch_docker} '${schematicPath}' '${tempFolder}'`,
  )
  log.debug(r)
  const [tempSvg] = globule.find(path.join(tempFolder, '*.svg'))
  if (tempSvg == null) {
    throw Error('Could not process KiCad .sch file')
  }
  await exec(`mkdir -p ${outputFolder}`)
  await exec(`mv ${tempSvg} ${outputSvgPath}`)
  await exec(`rm -rf ${tempFolder}`)
}

export default processSchematics
