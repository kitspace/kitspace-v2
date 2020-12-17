const fs = require('fs')
const globule = require('globule')
const path = require('path')
const cp = require('child_process')
const Jszip = require('jszip')
const util = require('util')

const exec = util.promisify(cp.exec)
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)

const gerberFiles = require('./gerber_files')
const boardBuilder = require('./board_builder')

const topSvgPath = 'images/top.svg'
const bottomSvgPath = 'images/bottom.svg'
// TODO name the zip properly
const zipPath = 'gerbers.zip'
const zipInfoPath = 'zip-info.json'
const topPngPath = 'images/top.png'
const topLargePngPath = 'images/top-large.png'
const topMetaPngPath = 'images/top-meta.png'
const topWithBgndPath = 'images/top-with-background.png'

async function processGerbers(eventEmitter, root, kitspaceYaml, outputDir) {
  const files = globule.find(path.join(root, '**'))
  const gerberDir = kitspaceYaml.gerbers || ''
  const color = kitspaceYaml.color || 'green'

  let gerbers = gerberFiles(files, path.join(root, gerberDir))
  if (gerbers.length === 0) {
    return
  }

  eventEmitter.emit('in_progress', topSvgPath)
  eventEmitter.emit('in_progress', bottomSvgPath)
  eventEmitter.emit('in_progress', zipPath)
  eventEmitter.emit('in_progress', zipInfoPath)
  eventEmitter.emit('in_progress', topPngPath)
  eventEmitter.emit('in_progress', topLargePngPath)
  eventEmitter.emit('in_progress', topMetaPngPath)
  eventEmitter.emit('in_progress', topWithBgndPath)

  await exec('mkdir -p ' + path.join(outputDir, 'images'))

  if (gerbers.length === 1 && path.extname(gerbers[0]) === '.kicad_pcb') {
    const kicadPcbFile = gerbers[0]
    const gerberFolder = path.join('/tmp/kitspace', root, 'gerbers')
    await exec(`mkdir -p ${gerberFolder}`)
    const plot_kicad_gerbers = path.join(__dirname, 'plot_kicad_gerbers')
    const cmd_plot = `${plot_kicad_gerbers} ${kicadPcbFile} ${gerberFolder}`
    await exec(cmd_plot)
    gerbers = globule.find(path.join(gerberFolder, '*'))
  }
  const zip = new Jszip()

  const stackupData = []
  const folderName = path.basename(zipPath, '.zip')
  for (const gerberPath of gerbers) {
    const data = await readFile(gerberPath, { encoding: 'utf8' })
    stackupData.push({ filename: path.basename(gerberPath), gerber: data })
    zip.file(path.join(folderName, path.basename(gerberPath)), data)
  }

  zip
    .generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    .then(content => writeFile(path.join(outputDir, zipPath), content))
    .then(() => {
      console.info('generated', zipPath)
      eventEmitter.emit('done', zipPath)
    })

  stackup = await boardBuilder(stackupData, color)

  writeFile(path.join(outputDir, bottomSvgPath), stackup.bottom.svg).then(() => {
    console.info('generated', bottomSvgPath)
    eventEmitter.emit('done', bottomSvgPath)
  })

  const zipInfo = {
    zipPath: path.basename(zipPath),
    folder: path.relative('build/', path.dirname(zipPath)),
    width: Math.max(stackup.top.width, stackup.bottom.width),
    height: Math.max(stackup.top.height, stackup.bottom.height),
    // copper layers - tcu, bcu, icu
    layers: stackup.layers.filter(layer => layer.type.includes('cu')).length,
  }
  if (stackup.top.units === 'in') {
    if (stackup.bottom.units !== 'in') {
      console.log({ f })
      throw new Error(`We got a weird board with disparate units: ${root}`)
    }
    zipInfo.width *= 25.4
    zipInfo.height *= 25.4
  }
  zipInfo.width = Math.ceil(zipInfo.width)
  zipInfo.height = Math.ceil(zipInfo.height)

  writeFile(path.join(outputDir, zipInfoPath), JSON.stringify(zipInfo)).then(() => {
    console.info('generated', zipInfoPath)
    eventEmitter.emit('done', zipInfoPath)
  })

  await writeFile(path.join(outputDir, topSvgPath), stackup.top.svg).then(() => {
    console.info('generated', topSvgPath)
    eventEmitter.emit('done', topSvgPath)
  })

  let cmd = `inkscape --without-gui '${path.join(outputDir, topSvgPath)}'`
  cmd += ` --export-png='${path.join(outputDir, topPngPath)}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd += ' --export-width=240'
  } else {
    cmd += ' --export-height=180'
  }
  exec(cmd).then(() => {
    console.info('generated', topPngPath)
    eventEmitter.emit('done', topPngPath)
  })

  let cmd_large = `inkscape --without-gui '${path.join(outputDir, topSvgPath)}'`
  cmd_large += ` --export-png='${path.join(outputDir, topLargePngPath)}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd_large += ` --export-width=${240 * 3 - 128}`
  } else {
    cmd_large += ` --export-height=${180 * 3 - 128}`
  }
  exec(cmd_large).then(() => {
    console.info('generated', topLargePngPath)
    eventEmitter.emit('done', topLargePngPath)
  })

  let cmd_meta = `inkscape --without-gui '${path.join(outputDir, topSvgPath)}'`
  cmd_meta += ` --export-png='${path.join(outputDir, topMetaPngPath)}'`
  const width = 900
  let height = 400
  const ratioW = width / stackup.top.width
  if (ratioW * stackup.top.height > height) {
    let ratioH = height / stackup.top.height
    while (ratioH * stackup.top.width > width) {
      height -= 1
      ratioH = height / stackup.top.height
    }
    cmd_meta += ` --export-height=${height}`
  } else {
    cmd_meta += ` --export-width=${width}`
  }

  await exec(cmd_meta).then(() => {
    console.info('generated', topMetaPngPath)
    eventEmitter.emit('done', topMetaPngPath)
  })

  cmd = `convert -background '#373737' -gravity center '${path.join(
    outputDir,
    topMetaPngPath,
  )}' -extent 1000x524 '${path.join(outputDir, topWithBgndPath)}'`
  exec(cmd).then(() => {
    console.info('generated', topWithBgndPath)
    eventEmitter.emit('done', topWithBgndPath)
  })
}

module.exports = processGerbers
