const fs = require('fs')
const globule = require('globule')
const path = require('path')
const Jszip = require('jszip')

const { existsAll, writeFile, readFile, exec } = require('../../utils')

const findGerberFiles = require('./findGerberFiles')
const boardBuilder = require('./board_builder')

function processGerbers(
  eventBus,
  { checkoutDir, kitspaceYaml, filesDir, zipVersion, name, plottedGerbers },
) {
  if (kitspaceYaml.multi) {
    const projectNames = Object.keys(kitspaceYaml.multi)
    return Promise.all(
      projectNames.map(projectName => {
        const projectOutputDir = path.join(filesDir, projectName)
        const projectKitspaceYaml = kitspaceYaml.multi[projectName]
        const projectPlottedGerbers = plottedGerbers[projectName]
        return _processGerbers(
          eventBus,
          checkoutDir,
          projectKitspaceYaml,
          projectOutputDir,
          zipVersion,
          projectName,
          projectPlottedGerbers,
        )
      }),
    )
  }
  return _processGerbers(
    eventBus,
    checkoutDir,
    kitspaceYaml,
    filesDir,
    zipVersion,
    name,
    plottedGerbers,
  )
}

async function _processGerbers(
  eventBus,
  inputDir,
  kitspaceYaml,
  outputDir,
  zipVersion,
  name,
  plottedGerbers,
) {
  const nameSplit = name.split('/')
  const zipFileName =
    nameSplit[nameSplit.length - 1] + '-' + zipVersion + '-gerbers.zip'
  const zipPath = path.join(outputDir, zipFileName)
  const topSvgPath = path.join(outputDir, 'images/top.svg')
  const bottomSvgPath = path.join(outputDir, 'images/bottom.svg')
  const gerberInfoPath = path.join(outputDir, 'gerber-info.json')
  const topPngPath = path.join(outputDir, 'images/top.png')
  const topLargePngPath = path.join(outputDir, 'images/top-large.png')
  const topMetaPngPath = path.join(outputDir, 'images/top-meta.png')
  const topWithBgndPath = path.join(outputDir, 'images/top-with-background.png')

  const filePaths = [
    zipPath,
    bottomSvgPath,
    gerberInfoPath,
    topSvgPath,
    topPngPath,
    topLargePngPath,
    topMetaPngPath,
    topWithBgndPath,
  ]

  for (const f of filePaths) {
    eventBus.emit('in_progress', f)
  }

  if (await existsAll(filePaths)) {
    for (const f of filePaths) {
      eventBus.emit('done', f)
    }
    return
  }

  try {
    const gerberDir = kitspaceYaml.gerbers || ''
    const color = kitspaceYaml.color || 'green'

    await exec('mkdir -p ' + path.join(outputDir, 'images'))

    const files = globule.find(path.join(inputDir, '**'))

    const gerberTypes = findGerberFiles(files, path.join(inputDir, gerberDir))
    let gerbers = Object.keys(gerberTypes)

    let inputFiles
    // XXX this is 5 due to whats-that-gerber matching non-gerber files and 5
    // being a number that works for the projects currently on kitspace. it
    // could cause problems with new projects and should be fixed in
    // whats-that-gerber
    // https://github.com/tracespace/tracespace/issues/357
    if (gerbers.length < 5) {
      if (plottedGerbers.gerbers.length === 0) {
        throw Error('No PCB files found')
      }
      gerbers = plottedGerbers.gerbers
      inputFiles = plottedGerbers.inputFiles
    } else {
      inputFiles = gerbers.reduce((result, k) => {
        return { ...result, [path.relative(inputDir, k)]: gerberTypes[k] }
      }, {})
    }

    const gerberData = await readGerbers(gerbers)

    const promises = []
    promises.push(
      generateZip(zipPath, gerberData)
        .then(() => eventBus.emit('done', zipPath))
        .catch(e => eventBus.emit('failed', zipPath, e)),
    )

    const stackup = await boardBuilder(gerberData, color)

    promises.push(
      writeFile(bottomSvgPath, stackup.bottom.svg)
        .then(() => eventBus.emit('done', bottomSvgPath))
        .catch(e => eventBus.emit('failed', bottomSvgPath, e)),
    )

    promises.push(
      generateGerberInfo(zipPath, stackup, inputFiles, gerberInfoPath)
        .then(() => eventBus.emit('done', gerberInfoPath))
        .catch(e => eventBus.emit('failed', gerberInfoPath, e)),
    )

    await writeFile(topSvgPath, stackup.top.svg)
      .then(() => eventBus.emit('done', topSvgPath))
      .catch(e => eventBus.emit('failed', topSvgPath, e))

    promises.push(
      generateTopPng(topSvgPath, stackup, topPngPath)
        .then(() => eventBus.emit('done', topPngPath))
        .catch(e => eventBus.emit('failed', topPngPath, e)),
    )

    promises.push(
      generateTopLargePng(topSvgPath, stackup, topLargePngPath)
        .then(() => eventBus.emit('done', topLargePngPath))
        .catch(e => eventBus.emit('failed', topLargePngPath, e)),
    )

    await generateTopMetaPng(topSvgPath, stackup, topMetaPngPath)
      .then(() => eventBus.emit('done', topMetaPngPath))
      .catch(e => eventBus.emit('failed', topMetaPngPath, e))

    promises.push(
      generateTopWithBgnd(topMetaPngPath, topWithBgndPath)
        .then(() => eventBus.emit('done', topWithBgndPath))
        .catch(e => eventBus.emit('failed', topWithBgndPath, e)),
    )

    await Promise.all(promises)
  } catch (e) {
    for (const f of filePaths) {
      eventBus.emit('failed', f, e)
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

function generateGerberInfo(zipPath, stackup, inputFiles, gerberInfoPath) {
  const gerberInfo = {
    zipPath: path.basename(zipPath),
    width: Math.ceil(Math.max(stackup.top.width, stackup.bottom.width)),
    height: Math.ceil(Math.max(stackup.top.height, stackup.bottom.height)),
    layers: stackup.layers.filter(l => l.type === 'copper').length,
    inputFiles,
  }
  if (stackup.top.units === 'in') {
    if (stackup.bottom.units !== 'in') {
      throw new Error('Disparate units in PCB files. Expecting in on bottom.')
    }
    gerberInfo.width *= 25.4
    gerberInfo.height *= 25.4
  } else {
    if (stackup.bottom.units === 'in') {
      throw new Error('Disparate units in PCB files. Expecting mm on bottom.')
    }
  }
  gerberInfo.width = Math.ceil(gerberInfo.width)
  gerberInfo.height = Math.ceil(gerberInfo.height)

  return writeFile(path.join(gerberInfoPath), JSON.stringify(gerberInfo))
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

module.exports = processGerbers
