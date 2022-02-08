import * as ClickBom from '1-click-bom'
import * as loglevel from 'loglevel'
import * as path from 'path'
import getPartinfo from './get_partinfo'

import { exists, existsAll, writeFile, readFile } from '../../utils'


// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function processBOM(job, { inputDir, kitspaceYaml = {}, outputDir } : any) {
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
    return
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
    const bom = ClickBom.parse(content, {
      ext: /\.kicad_pcb$/i.test(bomInputPath) ? 'kicad_pcb' : null,
    })

    if (bom.invalid != null) {
      bom.invalid.forEach(invalid => {
        loglevel.warn('invalid line:', invalid)
      })
    }
    if (bom.warnings != null) {
      bom.warnings.forEach(warning => {
        loglevel.warn('warning:', warning)
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
      return
    }
    bom.tsv = ClickBom.writeTSV(bom.lines)

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
  } catch (error) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'failed', file, error })
    }
  }
}

export default processBOM
