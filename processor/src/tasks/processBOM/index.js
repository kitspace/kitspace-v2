const oneClickBOM = require('1-click-bom')
const fs = require('fs')
const path = require('path')
const util = require('util')
const cp = require('child_process')
const getPartinfo = require('./get_partinfo')

const { exists, existsAll } = require('../../utils')

const exec = util.promisify(cp.exec)
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)

function processBOM(events, inputDir, kitspaceYaml, outputDir, hash, name) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(outputDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        return _processBOM(
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
  return _processBOM(events, inputDir, kitspaceYaml, outputDir, hash, name)
}

async function _processBOM(events, inputDir, kitspaceYaml, outputDir, hash, name) {
  const bomOutputPath = path.join(outputDir, '1-click-BOM.tsv')
  const infoJsonPath = path.join(outputDir, 'bom-info.json')

  const filePaths = [bomOutputPath, infoJsonPath]

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
      for (const f of filePaths) {
        events.emit('failed', f, { message: 'No lines in BOM found' })
      }
      return
    }
    bom.tsv = oneClickBOM.writeTSV(bom.lines)

    bom.parts = await getPartinfo(bom.lines)

    const info = { bom, inputFile: path.relative(inputDir, bomInputPath) }
    await Promise.all([
      writeFile(infoJsonPath, JSON.stringify(info))
        .then(() => events.emit('done', infoJsonPath))
        .catch(e => events.emit('failed', infoJsonPath, e)),
      writeFile(bomOutputPath, bom.tsv)
        .then(() => events.emit('done', bomOutputPath))
        .catch(e => events.emit('failed', bomOutputPath, e)),
    ])
  } catch (e) {
    for (const f of filePaths) {
      events.emit('failed', f, e)
    }
  }
}

module.exports = processBOM
