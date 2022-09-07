import * as oneClickBom from '1-click-bom'
import path from 'node:path'
import log from 'loglevel'

import { exists, existsAll, writeFile, readFile } from '../../utils.js'
import { JobData } from '../../jobData.js'
import getPartinfo from './get_partinfo.js'

async function processBOM(
  job,
  { inputDir, kitspaceYaml, outputDir }: Partial<JobData>,
) {
  const bomOutputPath = path.join(outputDir, '1-click-BOM.tsv')
  const infoJsonPath = path.join(outputDir, 'bom-info.json')

  const filePaths = [bomOutputPath, infoJsonPath]

  for (const file of filePaths) {
    job.updateProgress({ status: 'in_progress', file })
  }

  if (await existsAll(filePaths)) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'done', file })
    }
    const info = JSON.parse(await readFile(infoJsonPath, 'utf-8'))
    return info.bom
  }

  try {
    let bomInputPath
    if (kitspaceYaml.bom) {
      bomInputPath = path.join(inputDir, kitspaceYaml.bom)
    } else {
      bomInputPath = path.join(inputDir, '1-click-bom.tsv')
      if (!(await exists(bomInputPath))) {
        bomInputPath = path.join(inputDir, '1-click-bom.csv')
      }
    }
    const content = await readFile(bomInputPath)
    const bom = oneClickBom.parse(content, {
      ext: /\.kicad_pcb$/i.test(bomInputPath) ? 'kicad_pcb' : null,
    })

    if (bom.invalid != null) {
      bom.invalid.forEach(invalid => {
        const { ownerName, repoName } = job.data
        log.warn(`Invalid line in ${ownerName}/${repoName} bom file:`, invalid)
      })
    }
    if (bom.warnings != null) {
      bom.warnings.forEach(warning => {
        log.warn('warning:', warning)
      })
    }
    if (!bom.lines || bom.lines.length === 0) {
      for (const file of filePaths) {
        job.updateProgress({
          status: 'failed',
          file,
          error: Error('No lines in BOM found'),
        })
      }
      return {}
    }
    bom.tsv = oneClickBom.writeTSV(bom.lines)

    bom.parts = await getPartinfo(bom.lines)

    const info = { bom, inputFile: path.relative(inputDir, bomInputPath) }
    await Promise.all([
      writeFile(infoJsonPath, JSON.stringify(info))
        .then(() => job.updateProgress({ status: 'done', file: infoJsonPath }))
        .catch(error =>
          job.updateProgress({ status: 'failed', file: infoJsonPath, error }),
        ),
      writeFile(bomOutputPath, bom.tsv)
        .then(() => job.updateProgress({ status: 'done', file: bomOutputPath }))
        .catch(error =>
          job.updateProgress({ status: 'failed', file: bomOutputPath, error }),
        ),
    ])
    return info.bom
  } catch (error) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'failed', file, error })
    }
  }
}

export default processBOM
