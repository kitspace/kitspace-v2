import * as oneClickBom from '1-click-bom'
import { promises as fs } from 'fs'
import log from 'loglevel'
import path from 'node:path'
import { Job, JobData } from '../../job.js'
import { s3 } from '../../s3.js'
import { exists } from '../../utils.js'
import getPartinfo from './get_partinfo.js'

export const outputFiles = ['1-click-BOM.tsv', 'bom-info.json'] as const

async function processBOM(
  job: Job,
  { inputDir, kitspaceYaml, outputDir }: Partial<JobData>,
) {
  const bomOutputPath = path.join(outputDir, '1-click-BOM.tsv')
  const infoJsonPath = path.join(outputDir, 'bom-info.json')

  const filePaths = [bomOutputPath, infoJsonPath]

  for (const file of filePaths) {
    job.updateProgress({ status: 'in_progress', file, outputDir })
  }

  if (await s3.existsAll(filePaths)) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'done', file, outputDir })
    }
    const info = JSON.parse(await s3.getFileContents(infoJsonPath))
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
    const content = await fs.readFile(bomInputPath)
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
          outputDir,
          error: Error('No lines in BOM found'),
        })
      }
      return {}
    }
    bom.tsv = oneClickBom.writeTSV(bom.lines)

    bom.parts = await getPartinfo(bom.lines)

    const info = { bom, inputFile: path.relative(inputDir, bomInputPath) }
    await Promise.all([
      s3
        .uploadFileContents(infoJsonPath, JSON.stringify(info), 'application/json')
        .then(() =>
          job.updateProgress({ status: 'done', file: infoJsonPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({
            status: 'failed',
            file: infoJsonPath,
            outputDir,
            error,
          }),
        ),
      s3
        .uploadFileContents(bomOutputPath, bom.tsv, 'text/tab-seperated-values')
        .then(() =>
          job.updateProgress({ status: 'done', file: bomOutputPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({
            status: 'failed',
            file: bomOutputPath,
            error,
            outputDir,
          }),
        ),
    ])
    return info.bom
  } catch (error) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'failed', file, outputDir, error })
    }
  }
}

export default processBOM
