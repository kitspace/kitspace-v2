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

async function processBOM(
  eventEmitter,
  inputDir,
  kitspaceYaml,
  outputDir,
  hash,
  name,
) {
  const bomOutputPath = path.join(outputDir, '1-click-BOM.tsv')
  const infoJsonPath = path.join(outputDir, 'info.json')

  const filePaths = [bomOutputPath, infoJsonPath]

  for (const f of filePaths) {
    eventEmitter.emit('in_progress', f)
  }

  if (await existsAll(filePaths)) {
    for (const f of filePaths) {
      eventEmitter.emit('done', f)
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
        console.warning('invalid line:', invalid)
      })
    }
    if (bom.warnings != null) {
      bom.warnings.forEach(warning => {
        console.warning('warning:', warning)
      })
    }
    if (!bom.lines || bom.lines.length === 0) {
      for (const f of filePaths) {
        eventEmitter.emit('failed', f, { message: 'No lines in BOM found' })
      }
      return
    }
    bom.tsv = oneClickBOM.writeTSV(bom.lines)

    bom.parts = await getPartinfo(bom.lines)

    const site = kitspaceYaml.site || ''
    const info = { site, bom }
    await Promise.all([
      writeFile(infoJsonPath, JSON.stringify(info))
        .then(() => eventEmitter.emit('done', infoJsonPath))
        .catch(e => eventEmitter.emit('failed', infoJsonPath, e)),
      writeFile(bomOutputPath, bom.tsv)
        .then(() => eventEmitter.emit('done', bomOutputPath))
        .catch(e => eventEmitter.emit('failed', bomOutputPath, e)),
    ])
  } catch (e) {
    for (const f of filePaths) {
      eventEmitter.emit('failed', f, e)
    }
  }
}

module.exports = processBOM
