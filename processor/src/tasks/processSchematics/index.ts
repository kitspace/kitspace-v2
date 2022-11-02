import path from 'node:path'
import globule from 'globule'
import log from 'loglevel'
import url from 'node:url'

import { existsAll, execEscaped, findKicadSchematic } from '../../utils.js'
import { JobData } from '../../jobData.js'

async function processSchematics(
  job,
  { inputDir, kitspaceYaml = {}, outputDir }: Partial<JobData>,
) {
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
    const files = globule.find(path.join(inputDir, '**'), { dot: true })
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
  await execEscaped(['rm', '-rf', tempFolder])
  await execEscaped(['mkdir', '-p', tempFolder])
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const plot_kicad_sch_docker = path.join(__dirname, 'plot_kicad_sch_docker')
  const r = await execEscaped([plot_kicad_sch_docker, schematicPath, tempFolder])
  log.debug(r)
  const [tempSvg] = globule.find(path.join(tempFolder, '*.svg'), { dot: true })
  if (tempSvg == null) {
    throw Error('Could not process KiCad .sch file')
  }
  await execEscaped(['mkdir', '-p', outputFolder])
  await execEscaped(['mv', tempSvg, outputSvgPath])
  await execEscaped(['rm', '-rf', tempFolder])
}

export default processSchematics
