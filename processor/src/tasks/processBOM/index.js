const oneClickBOM = require('1-click-bom')
const path = require('path')
const getPartinfo = require('./get_partinfo')

const { exists, existsAll, writeFile, readFile } = require('../../utils')

function processBOM(job, { checkoutDir, kitspaceYaml, filesDir }) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(filesDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return _processBOM(job, checkoutDir, projectKitspaceYaml, projectOutputDir)
      }),
    )
  }
  return _processBOM(job, checkoutDir, kitspaceYaml, filesDir)
}

async function _processBOM(job, inputDir, kitspaceYaml, outputDir) {
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
    const bom = oneClickBOM.parse(content, {
      ext: /\.kicad_pcb$/i.test(bomInputPath) ? 'kicad_pcb' : null,
    })

    if (bom.invalid != null) {
      bom.invalid.forEach(invalid => {
        log.warn('invalid line:', invalid)
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
      return
    }
    bom.tsv = oneClickBOM.writeTSV(bom.lines)

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

module.exports = processBOM
