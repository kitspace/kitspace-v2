import * as child_process from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as globule from 'globule'

import { JobData } from '../../jobData'
import { exists } from '../../utils'

const exec = promisify(child_process.exec)
const readFile = promisify(fs.readFile)

async function processIBOM(
  job,
  { inputDir, kitspaceYaml, outputDir, repoName, subprojectName }: Partial<JobData>,
) {
  const ibomOutputPath = path.join(outputDir, 'interactive_bom.json')
  job.updateProgress({ status: 'in_progress', file: ibomOutputPath })

  if (await exists(ibomOutputPath)) {
    job.updateProgress({ status: 'done', file: ibomOutputPath })
    return
  }

  const summary = kitspaceYaml.summary || ''

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
  await exec(`mkdir -p ${ibomOutputFolder}`)

  const run_ibom = path.join(__dirname, 'run_ibom')
  await exec(
    `${run_ibom} '${pcbFile}' '${
      subprojectName ?? repoName
    }' '${summary}' '${ibomOutputPath}'`,
  )
    .then(() => job.updateProgress({ status: 'done', file: ibomOutputPath }))
    .catch(error =>
      job.updateProgress({ status: 'failed', file: ibomOutputPath, error }),
    )
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
