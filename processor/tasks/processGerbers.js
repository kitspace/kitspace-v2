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

async function* processGerbers(root, kitspaceYaml, outputDir) {
  const files = globule.find(path.join(root, '**'))
  const gerberDir = kitspaceYaml.gerbers || ''
  const color = kitspaceYaml.color || 'green'

  let gerbers = gerberFiles(files, path.join(root, gerberDir || ''))
  if (gerbers.length === 0) {
    return
  }

  const topSvgPath = path.join(outputDir, 'images/top.svg')
  yield [topSvgPath, 'in_progress']
  const bottomSvgPath = path.join(outputDir, 'images/bottom.svg')
  yield [bottomSvgPath, 'in_progress']
  // TODO name the zip properly
  const zipPath = path.join(outputDir, 'gerbers.zip')
  yield [zipPath, 'in_progress']
  const zipInfoPath = path.join(outputDir, 'zip-info.json')
  yield [zipInfoPath, 'in_progress']
  const topPngPath = path.join(outputDir, 'images/top.png')
  yield [topPngPath, 'in_progress']
  const topLargePngPath = path.join(outputDir, 'images/top-large.png')
  yield [topLargePngPath, 'in_progress']
  const topMetaPngPath = path.join(outputDir, 'images/top-meta.png')
  yield [topMetaPngPath, 'in_progress']
  const topWithBgndPath = path.join(outputDir, 'images/top-with-background.png')
  yield [topWithBgndPath, 'in_progress']

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

  yield zip
    .generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    .then(content => writeFile(zipPath, content))
    .then(() => {
      console.info('generated', zipPath)
      return [zipPath, 'done']
    })

  stackup = await boardBuilder(stackupData, color)

  yield writeFile(bottomSvgPath, stackup.bottom.svg).then(() => {
    console.info('generated', bottomSvgPath)
    return [bottomSvgPath, 'done']
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
      throw new Error(`We got a weird board with disparate units: ${root}`)
    }
    zipInfo.width *= 25.4
    zipInfo.height *= 25.4
  }
  zipInfo.width = Math.ceil(zipInfo.width)
  zipInfo.height = Math.ceil(zipInfo.height)

  yield writeFile(zipInfoPath, JSON.stringify(zipInfo)).then(() => {
    console.info('generated', zipInfoPath)
    return [zipInfoPath, 'done']
  })

  yield await writeFile(topSvgPath, stackup.top.svg).then(() => {
    console.info('generated', topSvgPath)
    return [topSvgPath, 'done']
  })

  let cmd = `inkscape --without-gui '${topSvgPath}'`
  cmd += ` --export-png='${topPngPath}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd += ' --export-width=240'
  } else {
    cmd += ' --export-height=180'
  }
  yield exec(cmd).then(() => {
    console.info('generated', topPngPath)
    return [topPngPath, 'done']
  })

  let cmd_large = `inkscape --without-gui '${topSvgPath}'`
  cmd_large += ` --export-png='${topLargePngPath}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd_large += ` --export-width=${240 * 3 - 128}`
  } else {
    cmd_large += ` --export-height=${180 * 3 - 128}`
  }
  exec(cmd_large).then(() => {
    console.info('generated', topLargePngPath)
    return [topLargePngPath, 'done']
  })

  let cmd_meta = `inkscape --without-gui '${topSvgPath}'`
  cmd_meta += ` --export-png='${topMetaPngPath}'`
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

  yield await exec(cmd_meta).then(() => {
    console.info('generated', topMetaPngPath)
    return [topMetaPngPath, 'done']
  })

  cmd = `convert -background '#373737' -gravity center '${topMetaPngPath}' -extent 1000x524 '${topWithBgndPath}'`
  yield exec(cmd).then(() => {
    console.info('generated', topWithBgndPath)
    return [topWithBgndPath, 'done']
  })
}

module.exports = processGerbers
