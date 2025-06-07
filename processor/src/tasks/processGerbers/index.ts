import globule from 'globule'
import Jszip from 'jszip'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Job, ProjectJobData } from '../../job.js'
import * as s3 from '../../s3.js'
import { sh } from '../../shell.js'
import boardBuilder from './board_builder.js'
import findGerberFiles from './findGerberFiles.js'

export const outputFiles = [
  '*-*-gerbers.zip',
  'images/top.svg',
  'images/bottom.svg',
  'gerber-info.json',
  'images/top.png',
  'images/top-large.png',
  'images/top-with-background.png',
] as const

interface PlottedGerbers {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gerbers: Array<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputFiles: Record<string, any>
}

interface ProcessGerbersData {
  plottedGerbers: PlottedGerbers
}

export default async function processGerbers(
  job: Job,
  {
    inputDir,
    kitspaceYaml,
    outputDir,
    repoName,
    subprojectName,
    plottedGerbers,
    hash,
  }: ProcessGerbersData & Partial<ProjectJobData>,
) {
  const zipVersion = hash.slice(0, 7)
  const zipFileName = `${
    subprojectName === '_' ? repoName : subprojectName
  }-${zipVersion}-gerbers.zip`
  const zipPath = path.join(outputDir, zipFileName)
  const topSvgPath = path.join(outputDir, 'images/top.svg')
  const bottomSvgPath = path.join(outputDir, 'images/bottom.svg')
  const gerberInfoPath = path.join(outputDir, 'gerber-info.json')
  const topPngPath = path.join(outputDir, 'images/top.png')
  const topLargePngPath = path.join(outputDir, 'images/top-large.png')
  const topWithBgndPath = path.join(outputDir, 'images/top-with-background.png')

  const filePaths = [
    zipPath,
    bottomSvgPath,
    gerberInfoPath,
    topSvgPath,
    topPngPath,
    topLargePngPath,
    topWithBgndPath,
  ]

  const topMetaPngPath = path.join(outputDir, 'images/top-meta.png')

  for (const file of filePaths) {
    await job.updateProgress({ status: 'in_progress', file, outputDir })
  }

  if (await s3.existsAll(filePaths)) {
    for (const file of filePaths) {
      await job.updateProgress({ status: 'done', file, outputDir })
    }
    return
  }

  try {
    await fs.mkdir(path.join(outputDir, 'images'), { recursive: true })

    let inputFiles: PlottedGerbers['inputFiles']
    let gerbers: PlottedGerbers['gerbers']

    if (plottedGerbers.gerbers.length === 0) {
      const gerberDir = kitspaceYaml.gerbers || ''
      const files = globule.find(path.join(inputDir, '**'), { dot: true })
      const gerberTypes = findGerberFiles(files, path.join(inputDir, gerberDir))
      gerbers = Object.keys(gerberTypes)
      // XXX this is 5 due to whats-that-gerber matching non-gerber files and 5
      // being a number that works for the projects currently on kitspace. it
      // could cause problems with new projects and should be fixed in
      // whats-that-gerber
      // https://github.com/tracespace/tracespace/issues/357
      if (gerbers.length < 5) {
        throw Error('No PCB files found')
      } else {
        inputFiles = gerbers.reduce(
          (result, k) => ({
            ...result,
            [path.relative(inputDir, k)]: gerberTypes[k],
          }),
          {},
        )
      }
    } else {
      gerbers = plottedGerbers.gerbers
      inputFiles = plottedGerbers.inputFiles
    }

    const gerberData = await readGerbers(gerbers)

    const promises = []
    promises.push(
      generateZip(zipPath, gerberData)
        .then(() =>
          job.updateProgress({ status: 'done', file: zipPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({ status: 'failed', file: zipPath, error, outputDir }),
        ),
    )

    const color = kitspaceYaml.color || 'green'
    const stackup = await boardBuilder(gerberData, color)

    promises.push(
      s3
        .uploadFileContents(bottomSvgPath, stackup.bottom.svg, 'image/svg+xml')
        .then(() =>
          job.updateProgress({ status: 'done', file: bottomSvgPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({
            status: 'failed',
            file: bottomSvgPath,
            error,
            outputDir,
          }),
        ),
    )

    promises.push(
      generateGerberInfo(zipPath, stackup, inputFiles, gerberInfoPath)
        .then(() =>
          job.updateProgress({ status: 'done', file: gerberInfoPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({
            status: 'failed',
            file: gerberInfoPath,
            error,
            outputDir,
          }),
        ),
    )

    promises.push(
      s3
        .uploadFileContents(topSvgPath, stackup.top.svg, 'image/svg+xml')
        .then(() =>
          job.updateProgress({ status: 'done', file: topSvgPath, outputDir }),
        )
        .catch(error =>
          job.updateProgress({
            status: 'failed',
            file: topSvgPath,
            error,
            outputDir,
          }),
        ),
    )

    await fs.writeFile(topSvgPath, stackup.top.svg)

    // The generate*Png tasks shouldn't run concurrently so we `await` them in
    // sequence. They all invoke Inkscape and can use a lot of RAM so we run them
    // one at a time even though they don't depend on each other.

    await generateTopPng(topSvgPath, stackup, topPngPath)
      .then(() =>
        job.updateProgress({ status: 'done', file: topPngPath, outputDir }),
      )
      .catch(error =>
        job.updateProgress({
          status: 'failed',
          file: topPngPath,
          error,
          outputDir,
        }),
      )

    await generateTopLargePng(topSvgPath, stackup, topLargePngPath)
      .then(() =>
        job.updateProgress({ status: 'done', file: topLargePngPath, outputDir }),
      )
      .catch(error =>
        job.updateProgress({
          status: 'failed',
          file: topLargePngPath,
          error,
          outputDir,
        }),
      )

    await generateTopMetaPng(topSvgPath, stackup, topMetaPngPath)

    await generateTopWithBgnd(topMetaPngPath, topWithBgndPath)
      .then(() =>
        job.updateProgress({ status: 'done', file: topWithBgndPath, outputDir }),
      )
      .catch(error =>
        job.updateProgress({
          status: 'failed',
          file: topWithBgndPath,
          error,
          outputDir,
        }),
      )

    await Promise.all(promises)
  } catch (error) {
    for (const file of filePaths) {
      await job.updateProgress({ status: 'failed', file, error, outputDir })
    }
  }

  await Promise.all(
    [...filePaths, topMetaPngPath].map(fp => fs.rm(fp, { force: true })),
  )
}

async function generateTopLargePng(topSvgPath, stackup, topLargePngPath) {
  let constraint: string
  if (stackup.top.width > stackup.top.height + 0.05) {
    constraint = `--export-width=${240 * 2 - 128}`
  } else {
    constraint = `--export-height=${180 * 2 - 128}`
  }
  await sh`inkscape --without-gui ${topSvgPath} ${constraint} --export-png=${topLargePngPath}`
  await sh`optipng -o7 ${topLargePngPath}`
  await s3.uploadFile(topLargePngPath, 'image/png')
}

async function generateTopPng(topSvgPath, stackup, topPngPath) {
  let constraint: string
  if (stackup.top.width > stackup.top.height + 0.05) {
    constraint = `--export-width=${240}`
  } else {
    constraint = `--export-height=${180}`
  }
  await sh`inkscape --without-gui ${topSvgPath} ${constraint} --export-png=${topPngPath}`
  await sh`optipng -o7 ${topPngPath}`
  return s3.uploadFile(topPngPath, 'image/png')
}

async function generateTopMetaPng(topSvgPath, stackup, topMetaPngPath) {
  const width = 900
  let height = 400
  const ratioW = width / stackup.top.width
  const isWide = ratioW * stackup.top.height > height
  if (isWide) {
    let ratioH = height / stackup.top.height
    while (ratioH * stackup.top.width > width) {
      height -= 1
      ratioH = height / stackup.top.height
    }
  }
  const constraint = isWide
    ? `--export-height=${height}`
    : `--export-width=${width}`
  await sh`inkscape --without-gui ${topSvgPath} ${constraint} --export-png=${topMetaPngPath}`
}

async function generateTopWithBgnd(topMetaPngPath, topWithBgndPath) {
  await sh`convert -background '#373737' -gravity center ${topMetaPngPath} -extent 1000x524 ${topWithBgndPath}`
  return s3.uploadFile(topWithBgndPath, 'image/png')
}

function generateGerberInfo(
  zipPath,
  stackup,
  inputFiles,
  gerberInfoPath,
): Promise<void> {
  const gerberInfo = {
    zipPath: path.basename(zipPath),
    width: Math.ceil(Math.max(stackup.top.width, stackup.bottom.width)),
    height: Math.ceil(Math.max(stackup.top.height, stackup.bottom.height)),
    layers: stackup.layers.filter(l => l.type === 'copper').length,
    inputFiles,
  }
  if (stackup.top.units === 'in') {
    if (stackup.bottom.units !== 'in') {
      throw new Error('Disparate units in PCB files. Expecting inches on bottom.')
    }
    gerberInfo.width *= 25.4
    gerberInfo.height *= 25.4
  } else if (stackup.bottom.units === 'in') {
    throw new Error('Disparate units in PCB files. Expecting mm on bottom.')
  }
  gerberInfo.width = Math.ceil(gerberInfo.width)
  gerberInfo.height = Math.ceil(gerberInfo.height)

  return s3.uploadFileContents(
    gerberInfoPath,
    JSON.stringify(gerberInfo),
    'application/json',
  )
}

function readGerbers(
  gerbers: Array<string>,
): Promise<Array<{ filename: string; gerber: string }>> {
  return Promise.all(
    gerbers.map(async gerberPath => {
      const data = await fs.readFile(gerberPath, { encoding: 'utf8' })
      return { filename: path.basename(gerberPath), gerber: data }
    }),
  )
}

function generateZip(zipPath, gerberData): Promise<void> {
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
    .then(contents => s3.uploadFileContents(zipPath, contents, 'application/zip'))
}
