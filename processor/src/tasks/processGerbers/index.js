const fs = require('fs')
const globule = require('globule')
const path = require('path')
const cp = require('child_process')
const Jszip = require('jszip')
const util = require('util')

const { existsAll } = require('../../utils')
const exec = util.promisify(cp.exec)
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile)

const gerberFiles = require('./gerber_files')
const boardBuilder = require('./board_builder')

async function processGerbers(
  eventEmitter,
  inputDir,
  kitspaceYaml,
  outputDir,
  hash,
  name,
) {
  const zipFileName = name.split('/')[1] + '-' + hash.slice(0, 7) + '-gerbers.zip'
  const zipPath = path.join(outputDir, zipFileName)
  const topSvgPath = path.join(outputDir, 'images/top.svg')
  const bottomSvgPath = path.join(outputDir, 'images/bottom.svg')
  const zipInfoPath = path.join(outputDir, 'zip-info.json')
  const topPngPath = path.join(outputDir, 'images/top.png')
  const topLargePngPath = path.join(outputDir, 'images/top-large.png')
  const topMetaPngPath = path.join(outputDir, 'images/top-meta.png')
  const topWithBgndPath = path.join(outputDir, 'images/top-with-background.png')

  const filePaths = [
    zipPath,
    bottomSvgPath,
    zipInfoPath,
    topSvgPath,
    topPngPath,
    topLargePngPath,
    topMetaPngPath,
    topWithBgndPath,
  ]

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
    const gerberDir = kitspaceYaml.gerbers || ''
    const color = kitspaceYaml.color || 'green'

    await exec('mkdir -p ' + path.join(outputDir, 'images'))

    const files = globule.find(path.join(inputDir, '**'))

    let gerbers = gerberFiles(files, path.join(inputDir, gerberDir))
    if (gerbers.length === 0) {
      gerbers = await plotKicad(inputDir, files, kitspaceYaml)
    }

    const gerberData = await readGerbers(gerbers)

    const promises = []
    promises.push(
      generateZip(zipPath, gerberData)
        .then(() => eventEmitter.emit('done', zipPath))
        .catch(e => eventEmitter.emit('failed', zipPath, e)),
    )

    const stackup = await boardBuilder(gerberData, color)

    promises.push(
      writeFile(bottomSvgPath, stackup.bottom.svg)
        .then(() => eventEmitter.emit('done', bottomSvgPath))
        .catch(e => eventEmitter.emit('failed', bottomSvgPath, e)),
    )

    promises.push(
      generateZipInfo(zipPath, stackup, zipInfoPath)
        .then(() => eventEmitter.emit('done', zipInfoPath))
        .catch(e => eventEmitter.emit('failed', zipInfoPath, e)),
    )

    await writeFile(topSvgPath, stackup.top.svg)
      .then(() => eventEmitter.emit('done', topSvgPath))
      .catch(e => eventEmitter.emit('failed', topSvgPath, e))

    promises.push(
      generateTopPng(topSvgPath, stackup, topPngPath)
        .then(() => eventEmitter.emit('done', topPngPath))
        .catch(e => eventEmitter.emit('failed', topPngPath, e)),
    )

    promises.push(
      generateTopLargePng(topSvgPath, stackup, topLargePngPath)
        .then(() => eventEmitter.emit('done', topLargePngPath))
        .catch(e => eventEmitter.emit('failed', topLargePngPath, e)),
    )

    await generateTopMetaPng(topSvgPath, stackup, topMetaPngPath)
      .then(() => eventEmitter.emit('done', topMetaPngPath))
      .catch(e => eventEmitter.emit('failed', topMetaPngPath, e))

    promises.push(
      generateTopWithBgnd(topMetaPngPath, topWithBgndPath)
        .then(() => eventEmitter.emit('done', topWithBgndPath))
        .catch(e => eventEmitter.emit('failed', topWithBgndPath, e)),
    )

    await Promise.all(promises)
  } catch (e) {
    for (const f of filePaths) {
      eventEmitter.emit('failed', f, e)
    }
  }
}

function generateTopLargePng(topSvgPath, stackup, topLargePngPath) {
  let cmd_large = `inkscape --without-gui '${topSvgPath}'`
  cmd_large += ` --export-png='${topLargePngPath}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd_large += ` --export-width=${240 * 3 - 128}`
  } else {
    cmd_large += ` --export-height=${180 * 3 - 128}`
  }
  return exec(cmd_large)
}

function generateTopPng(topSvgPath, stackup, topPngPath) {
  let cmd = `inkscape --without-gui '${topSvgPath}'`
  cmd += ` --export-png='${topPngPath}'`
  if (stackup.top.width > stackup.top.height + 0.05) {
    cmd += ' --export-width=240'
  } else {
    cmd += ' --export-height=180'
  }
  return exec(cmd)
}

function generateTopMetaPng(topSvgPath, stackup, topMetaPngPath) {
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

  return exec(cmd_meta)
}

function generateTopWithBgnd(topMetaPngPath, topWithBgndPath) {
  const cmd = `convert -background '#373737' -gravity center '${topMetaPngPath}' -extent 1000x524 '${topWithBgndPath}'`
  return exec(cmd)
}

function generateZipInfo(zipPath, stackup, zipInfoPath) {
  const zipInfo = {
    zipPath: path.basename(zipPath),
    width: Math.max(stackup.top.width, stackup.bottom.width),
    height: Math.max(stackup.top.height, stackup.bottom.height),
    // copper layers - tcu, bcu, icu
    layers: stackup.layers.filter(layer => layer.type.includes('cu')).length,
  }
  if (stackup.top.units === 'in') {
    if (stackup.bottom.units !== 'in') {
      throw new Error('Disparate units in PCB files. Expecting in on bottom.')
    }
    zipInfo.width *= 25.4
    zipInfo.height *= 25.4
  } else {
    if (stackup.bottom.units === 'in') {
      throw new Error('Disparate units in PCB files. Expecting mm on bottom.')
    }
  }
  zipInfo.width = Math.ceil(zipInfo.width)
  zipInfo.height = Math.ceil(zipInfo.height)

  return writeFile(path.join(zipInfoPath), JSON.stringify(zipInfo))
}

function readGerbers(gerbers) {
  return Promise.all(
    gerbers.map(async gerberPath => {
      const data = await readFile(gerberPath, { encoding: 'utf8' })
      return { filename: path.basename(gerberPath), gerber: data }
    }),
  )
}

async function generateZip(zipPath, gerberData) {
  const folderName = path.basename(zipPath, '.zip')
  const zip = new Jszip()
  for (const { filename, gerber } of gerberData) {
    zip.file(path.join(folderName, path.basename(filename)), gerber)
  }
  return zip
    .generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    .then(content => writeFile(zipPath, content))
}

async function plotKicad(inputDir, files, kitspaceYaml) {
  let kicadPcbFile
  if (
    kitspaceYaml.eda &&
    kitspaceYaml.eda.type === 'kicad' &&
    kitspaceYaml.eda.pcb
  ) {
    kicadPcbFile = path.join(inputDir, kitspaceYaml.eda.pcb)
  } else {
    kicadPcbFile = files.find(file => file.endsWith('.kicad_pcb'))
  }
  if (kicadPcbFile == null) {
    throw Error('No PCB files found')
  }
  const gerberFolder = path.join('/tmp/kitspace', inputDir, 'gerbers')
  await exec(`rm -rf ${gerberFolder} && mkdir -p ${gerberFolder}`)
  const plot_kicad_gerbers = path.join(__dirname, 'plot_kicad_gerbers')
  const cmd_plot = `${plot_kicad_gerbers} ${kicadPcbFile} ${gerberFolder}`
  await exec(cmd_plot)
  return globule.find(path.join(gerberFolder, '*'))
}

module.exports = processGerbers
