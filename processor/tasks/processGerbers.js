const fs = require('fs')
const globule = require('globule')
const path = require('path')
const cp = require('child_process')
const Jszip = require('jszip')
const util = require('util')

const exec = util.promisify(cp.exec)
const writeFile = util.promisify(fs.writeFile)

const gerberFiles = require('./gerber_files')
const boardBuilder = require('./board_builder')

module.exports = async (root, gerberDir, color, outputDir) => {
  await exec('mkdir -p ' + path.join(outputDir, 'images'))

  const topSvgPath = path.join(outputDir, 'images/top.svg')
  const bottomSvgPath = path.join(outputDir, 'images/bottom.svg')
  // TODO name the zip properly
  const zipPath = path.join(outputDir, 'gerbers.zip')
  const zipInfoPath = path.join(outputDir, 'zip-info.json')
  const unOptimizedSvgPath = path.join(outputDir, 'images/unoptimized-top.svg')
  const topPngPath = path.join(outputDir, 'images/top.png')
  const topLargePngPath = path.join(outputDir, 'images/top-large.png')
  const topMetaPngPath = path.join(outputDir, 'images/top-meta.png')
  const topWithBgndPath = path.join(outputDir, 'images/top-with-background.png')

  const files = globule.find(path.join(root, '**'))

  let gerbers = gerberFiles(files, path.join(root, gerberDir || ''))
  if (gerbers.length === 0) {
    return
  }

  if (gerbers.length === 1 && path.extname(gerbers[0]) === '.kicad_pcb') {
    const kicadPcbFile = gerbers[0]
    const gerberFolder = path.join('/tmp/kitspace', root, 'gerbers')
    const plot_kicad_gerbers = path.join(__dirname, 'plot_kicad_gerbers')
    const cmd_plot = `${plot_kicad_gerbers} ${kicadPcbFile} ${gerberFolder}`
    await exec(`mkdir -p ${gerberFolder}`)
    await exec(cmd_plot)
    gerbers = globule.find(path.join(gerberFolder, '*'))
  }
  const zipInfo = {
    zipPath: path.basename(zipPath),
    folder: path.relative('build/', path.dirname(zipPath)),
  }
  const zip = new Jszip()

  let data
  const stackupData = []
  for (const gerberPath of gerbers) {
    data = fs.readFileSync(gerberPath, { encoding: 'utf8' })
    stackupData.push({ filename: path.basename(gerberPath), gerber: data })
    const folder_name = path.basename(zipPath, '.zip')
    zip.file(path.join(folder_name, path.basename(gerberPath)), data)
  }
  zip
    .generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })
    .then(content => writeFile(zipPath, content))
    .catch(err => {
      console.error(`Could not write gerber zip for ${root}`)
    })
    .then(() => console.log('generated', zipPath))

  boardBuilder(stackupData, color || 'green', function (error, stackup) {
    if (error != null) {
      throw error
    }
    zipInfo.width = Math.max(stackup.top.width, stackup.bottom.width)
    zipInfo.height = Math.max(stackup.top.height, stackup.bottom.height)
    if (stackup.top.units === 'in') {
      if (stackup.bottom.units !== 'in') {
        console.error('We got a weird board with disparate units:', root)
        process.exit(1)
      }
      zipInfo.width *= 25.4
      zipInfo.height *= 25.4
    }
    zipInfo.width = Math.ceil(zipInfo.width)
    zipInfo.height = Math.ceil(zipInfo.height)
    zipInfo.layers = stackup.layers.filter(layer => {
      // copper layers - tcu, bcu, icu
      return layer.type.includes('cu')
    }).length
    fs.writeFileSync(zipInfoPath, JSON.stringify(zipInfo))
    console.log('generated', zipInfoPath)

    fs.writeFile(unOptimizedSvgPath, stackup.top.svg, function (err) {
      if (err != null) {
        console.error(`Could not write unoptimized top svg for ${root}`)
        console.error(err)
        return process.exit(1)
      }
      console.log('generated', unOptimizedSvgPath)
      let cmd = `inkscape --without-gui '${unOptimizedSvgPath}'`
      cmd += ` --export-png='${topPngPath}'`
      if (stackup.top.width > stackup.top.height + 0.05) {
        cmd += ' --export-width=240'
      } else {
        cmd += ' --export-height=180'
      }
      cp.exec(cmd, err => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        console.log('generated', topPngPath)
      })
      let cmd_large = `inkscape --without-gui '${unOptimizedSvgPath}'`
      cmd_large += ` --export-png='${topLargePngPath}'`
      if (stackup.top.width > stackup.top.height + 0.05) {
        cmd_large += ` --export-width=${240 * 3 - 128}`
      } else {
        cmd_large += ` --export-height=${180 * 3 - 128}`
      }
      cp.exec(cmd_large, err => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        console.log('generated', topLargePngPath)
      })
      let cmd_meta = `inkscape --without-gui '${unOptimizedSvgPath}'`
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
      cp.exec(cmd_meta, err => {
        if (err) {
          console.error(err)
          return process.exit(1)
        }
        console.log('generated', topMetaPngPath)
        const cmd = `convert -background '#373737' -gravity center '${topMetaPngPath}' -extent 1000x524 '${topWithBgndPath}'`
        cp.exec(cmd, err => {
          if (err) {
            console.error(err)
            return process.exit(1)
          }
          console.log('generated', topWithBgndPath)
        })
      })
    })
    fs.writeFile(topSvgPath, stackup.top.svg, function (err) {
      if (err != null) {
        console.error(`Could not write top svg for ${root}`)
        console.error(err)
        process.exit(1)
      }
      console.log('generated', topSvgPath)
    })
    fs.writeFile(bottomSvgPath, stackup.bottom.svg, function (err) {
      if (err != null) {
        console.error(`Could not write bottom svg for ${root}`)
        console.error(err)
        process.exit(1)
      }
      console.log('generated', bottomSvgPath)
    })
  })
}
