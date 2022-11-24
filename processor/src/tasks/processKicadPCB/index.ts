import globule from 'globule'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { Job, JobData } from '../../job.js'
import * as s3 from '../../s3.js'
import { execEscaped, findKicadPcbFile } from '../../utils.js'

export const outputFiles = ['images/layout.svg'] as const

export interface ProcessKicadPcbData {
  tmpDir: string
}

async function processKicadPCB(
  job: Job,
  {
    inputDir,
    kitspaceYaml = {},
    outputDir,
    tmpDir,
  }: ProcessKicadPcbData & Partial<JobData>,
) {
  const layoutSvgPath = path.join(outputDir, 'images/layout.svg')

  const filePaths = [layoutSvgPath]

  for (const file of filePaths) {
    job.updateProgress({ status: 'in_progress', file, outputDir })
  }

  if (await s3.existsAll(filePaths)) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'done', file, outputDir })
    }
    // XXX should really return gerbers here, but they are temp files
    return { inputFiles: {}, gerbers: [] }
  }

  try {
    const files = globule.find(path.join(inputDir, '**'), { dot: true })
    const kicadPcbFile = findKicadPcbFile(inputDir, files, kitspaceYaml)
    if (kicadPcbFile == null) {
      job.updateProgress({
        status: 'failed',
        file: layoutSvgPath,
        error: Error('No .kicad_pcb file found'),
        outputDir,
      })
      return { inputFiles: {}, gerbers: [] }
    }

    const layoutPromise = plotKicadLayoutSvg(layoutSvgPath, kicadPcbFile, tmpDir)
      .then(() =>
        job.updateProgress({ status: 'done', file: layoutSvgPath, outputDir }),
      )
      .catch(error =>
        job.updateProgress({
          status: 'failed',
          file: layoutSvgPath,
          error,
          outputDir,
        }),
      )

    // Only plot gerbers if there's no `gerbers` key in kitspace.yaml.
    let gerbers = []
    if (kitspaceYaml.gerbers == null) {
      gerbers = await plotKicadGerbers(kicadPcbFile, tmpDir)
    }

    await layoutPromise

    const relativeKicadPcbFile = path.relative(inputDir, kicadPcbFile)
    const inputFiles = { [relativeKicadPcbFile]: { type: 'kicad', side: null } }
    await fs.rm(layoutSvgPath)
    return { inputFiles, gerbers }
  } catch (error) {
    for (const file of filePaths) {
      job.updateProgress({ status: 'failed', file, error, outputDir })
    }
    await fs.rm(layoutSvgPath, { force: true })
    return { inputFiles: {}, gerbers: [] }
  }
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const plot_kicad_pcb = path.join(__dirname, 'plot_kicad_pcb')

async function plotKicadGerbers(kicadPcbFile, tmpDir) {
  const tmpGerberFolder = path.join(tmpDir, 'gerbers')
  await fs.mkdir(tmpGerberFolder)
  const plotCommand = [plot_kicad_pcb, 'gerber', kicadPcbFile, tmpGerberFolder]
  await execEscaped(plotCommand)
  return globule.find(path.join(tmpGerberFolder, '*'))
}

async function plotKicadLayoutSvg(
  layoutSvgPath: string,
  kicadPcbFile: string,
  tmpDir: string,
) {
  const tmpSvgFolder = path.join(tmpDir, 'svg')
  await fs.mkdir(tmpSvgFolder)
  const plotCommand = [
    plot_kicad_pcb,
    'svg',
    kicadPcbFile,
    tmpSvgFolder,
    layoutSvgPath,
  ]
  await execEscaped(plotCommand)
  await s3.uploadFile(layoutSvgPath, 'image/svg+xml')
}

export default processKicadPCB
