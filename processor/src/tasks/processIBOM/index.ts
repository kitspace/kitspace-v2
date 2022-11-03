import globule from 'globule'
import loglevel from 'loglevel'
import path from 'node:path'
import url from 'node:url'

import { JobData } from '../../jobData.js'
import { exists, execEscaped, readFile } from '../../utils.js'

async function processIBOM(
  job,
  { inputDir, kitspaceYaml, outputDir, repoName, subprojectName }: Partial<JobData>,
) {
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')

  const disableIBOM = !kitspaceYaml['ibom-enabled']
  if (disableIBOM) {
    job.updateProgress({
      status: 'failed',
      file: ibomOutputPath,
      error: new Error('IBOM is disabled.'),
    })
    return
  }

  job.updateProgress({ status: 'in_progress', file: ibomOutputPath })

  if (await exists(ibomOutputPath)) {
    job.updateProgress({ status: 'done', file: ibomOutputPath })
    return
  }

  let pcbFile
  if (
    kitspaceYaml.eda &&
    (kitspaceYaml.eda.type === 'kicad' || kitspaceYaml.eda.type === 'eagle') &&
    kitspaceYaml.eda.pcb != null
  ) {
    pcbFile = path.join(inputDir, kitspaceYaml.eda.pcb)
  } else if (kitspaceYaml.eda == null) {
    pcbFile = await findBoardFile(inputDir, 'kicad_pcb')
  }
  if (pcbFile == null) {
    pcbFile = await findBoardFile(inputDir, 'brd', checkEagleFile)
  }

  if (pcbFile == null) {
    job.updateProgress({
      status: 'failed',
      file: ibomOutputPath,
      error: Error('No PCB file found'),
    })
    return
  }

  const ibomOutputFolder = path.dirname(ibomOutputPath)
  await execEscaped(['mkdir', '-p', ibomOutputFolder])

  // !note: we can't escape empty `summary` so we have to quote it manually.
  const summary = kitspaceYaml.summary || "''"
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
  const run_ibom = path.join(__dirname, 'run_ibom')
  await execEscaped([
    run_ibom,
    pcbFile,
    subprojectName ?? repoName,
    summary,
    ibomOutputPath,
  ])
    .then(() => job.updateProgress({ status: 'done', file: ibomOutputPath }))
    .catch(error => {
      loglevel.debug(error.stack)
      return job.updateProgress({ status: 'failed', file: ibomOutputPath, error })
    })
}

async function findBoardFile(folderPath, ext, check?) {
  const f = globule.find(`${folderPath}/**/*.${ext}`)[0]
  if (check == null || (f != null && (await check(f)))) {
    return f
  }
  return null
}

async function checkEagleFile(f) {
  const contents = await readFile(f, 'utf8')
  return contents.includes('eagle.dtd')
}

export default processIBOM
