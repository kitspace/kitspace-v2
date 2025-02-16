import globule from 'globule'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import { Job, ProjectJobData } from '../../job.js'
import * as s3 from '../../s3.js'
import { sh } from '../../shell.js'
import { log } from '../../log.js'

export const outputFiles = ['interactive_bom.json'] as const

async function processIBOM(
  job: Job,
  {
    inputDir,
    kitspaceYaml,
    outputDir,
    repoName,
    subprojectName,
  }: Partial<ProjectJobData>,
) {
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')

  const disableIBOM = !kitspaceYaml['ibom-enabled']
  if (disableIBOM) {
    await job.updateProgress({
      status: 'failed',
      file: ibomOutputPath,
      error: new Error('IBOM is disabled.'),
      outputDir,
    })
    return
  }

  await job.updateProgress({
    status: 'in_progress',
    file: ibomOutputPath,
    outputDir,
  })

  if (await s3.exists(ibomOutputPath)) {
    await job.updateProgress({ status: 'done', file: ibomOutputPath, outputDir })
    return
  }

  let pcbFile
  if (kitspaceYaml.eda?.pcb != null) {
    pcbFile = path.join(inputDir, kitspaceYaml.eda.pcb)
  } else if (kitspaceYaml.eda == null) {
    pcbFile = await findBoardFile(inputDir, 'kicad_pcb')
  }
  if (pcbFile == null) {
    pcbFile = await findBoardFile(inputDir, 'brd', checkEagleFile)
  }
  if (pcbFile == null) {
    pcbFile = await findBoardFile(inputDir, 'json', checkEasyEdaFile)
  }

  if (pcbFile == null) {
    await job.updateProgress({
      status: 'failed',
      file: ibomOutputPath,
      error: Error('No PCB file found'),
      outputDir,
    })
    return
  }

  const ibomOutputFolder = path.dirname(ibomOutputPath)
  await fs.mkdir(ibomOutputFolder, { recursive: true })

  const summary = kitspaceYaml.summary
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const run_ibom = path.join(__dirname, 'run_ibom')
  const ibomName = subprojectName === '_' ? repoName : subprojectName
  await sh`${run_ibom} ${pcbFile} ${ibomName} ${summary} ${ibomOutputPath}`.catch(
    error => {
      log.debug(error.stack)
      return job.updateProgress({
        status: 'failed',
        file: ibomOutputPath,
        error,
        outputDir,
      })
    },
  )
  await s3
    .uploadFile(ibomOutputPath, 'application/json')
    .then(() =>
      job.updateProgress({ status: 'done', file: ibomOutputPath, outputDir }),
    )
    .catch(error =>
      job.updateProgress({
        status: 'failed',
        file: ibomOutputPath,
        error,
        outputDir,
      }),
    )
  await fs.rm(ibomOutputPath, { force: true })
}

async function findBoardFile(folderPath, ext, check?) {
  const f = globule.find(`${folderPath}/**/*.${ext}`)[0]
  try {
    if (check == null || (f != null && (await check(f)))) {
      return f
    }
  } catch (error) {
    log.warn(error)
  }
  return null
}

async function checkEagleFile(f) {
  const contents = await fs.readFile(f, 'utf8')
  return contents.includes('eagle.dtd')
}

async function checkEasyEdaFile(f) {
  const contents = await fs.readFile(f, 'utf8')
  const doc = JSON.parse(contents)
  return doc?.head?.docType === '3'
}

export default processIBOM
