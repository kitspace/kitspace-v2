import * as bullmq from 'bullmq'
import * as jsYaml from 'js-yaml'
import * as path from 'path'
import AsyncLock from 'async-lock'
import log from 'loglevel'
import slugify from 'url-slug'

import { JobData } from './jobData'
import { exists, exec, readFile } from './utils'
import { DATA_DIR } from './env'
import redisConnection from './redisConnection'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

const defaultJobOptions: bullmq.JobsOptions = {
  removeOnComplete: true,
  // remove our failed jobs while developing so they are retried.
  // in production we don't want them to be retried since it would waste
  // resources continually retrying them
  removeOnFail: process.env.NODE_ENV !== 'production',
}

const writeKitspaceYamlQueue = new bullmq.Queue('writeKitspaceYaml', {
  connection: redisConnection,
  defaultJobOptions,
})

const projectQueues = []
const processPCBQueue = new bullmq.Queue('processPCB', {
  connection: redisConnection,
  defaultJobOptions,
})
projectQueues.push(processPCBQueue)

const processInfoQueue = new bullmq.Queue('processInfo', {
  connection: redisConnection,
  defaultJobOptions,
})
projectQueues.push(processInfoQueue)

const processIBOMQueue = new bullmq.Queue('processIBOM', {
  connection: redisConnection,
  defaultJobOptions,
})
projectQueues.push(processIBOMQueue)

function createJobs(jobData: JobData) {
  const jobId = jobData.outputDir
  for (const q of projectQueues) {
    q.add('projectAPI', jobData, { jobId })
  }
}

export interface AddProjectToQueueData {
  ownerName: string
  repoName: string
  repoDescription: string,
  giteaId: string
  gitDir: string
}
export async function addProjectToQueues({
  ownerName,
  repoName,
  repoDescription,
  giteaId,
  gitDir,
}: AddProjectToQueueData) {
  const inputDir = path.join(
    DATA_DIR,
    'checkout',
    ownerName.toLowerCase(),
    repoName.toLowerCase(),
  )

  try {
    await sync(gitDir, inputDir)
  } catch (e) {
    console.log(e.stack)
    throw e
  }

  const hash = await getGitHash(inputDir)
  const outputDir = path.join(
    DATA_DIR,
    'files',
    ownerName.toLowerCase(),
    repoName.toLowerCase(),
    hash,
  )

  await exec(`mkdir -p ${outputDir}`)

  const kitspaceYaml = await getKitspaceYaml(inputDir)

  writeKitspaceYamlQueue.add(
    'projectAPI',
    { kitspaceYaml, outputDir },
    { jobId: outputDir },
  )

  if (kitspaceYaml.multi) {
    for (const subprojectName of Object.keys(kitspaceYaml.multi)) {
      const projectOutputDir = path.join(outputDir, subprojectName)
      const projectKitspaceYaml = kitspaceYaml.multi[subprojectName]
      // fall back to repo description if there's no summary.
      projectKitspaceYaml.summary ||= repoDescription

      createJobs({
        subprojectName,
        giteaId,
        inputDir,
        kitspaceYaml: projectKitspaceYaml,
        outputDir: projectOutputDir,
        ownerName,
        repoName,
        hash,
      })
    }
  } else {
    // fall back to repo description if there's no summary.
    kitspaceYaml.summary ||= repoDescription
    createJobs({
      giteaId,
      inputDir,
      kitspaceYaml,
      outputDir,
      ownerName,
      repoName,
      hash,
    })
  }
}

export async function stopQueues() {
  const qs = projectQueues.concat([writeKitspaceYamlQueue])
  await Promise.all(qs.map(q => q.obliterate({ force: true })))
}

async function getKitspaceYaml(inputDir) {
  const filePaths = [
    'kitspace.yaml',
    'kitspace.yml',
    'kitnic.yaml',
    'kitnic.yml',
  ].map(p => path.join(inputDir, p))
  const yamlFile = await Promise.all(filePaths.map(tryReadFile)).then(
    ([yaml, yml, kitnicYaml, kitnicYml]) => yaml || yml || kitnicYaml || kitnicYml,
  )
  const kitspaceYamlJson = jsYaml.safeLoad(yamlFile) || {}

  if (kitspaceYamlJson.multi) {
    // Slugify the subproject names.
    Object.keys(kitspaceYamlJson.multi).forEach(subProjectName => {
      const slugifiedName = slugify(subProjectName, { transformer: false })
      if (slugifiedName !== subProjectName) {
        // If the slugified name is different than the sub project name,
        // replace the sub project name with the slugified version.
        kitspaceYamlJson.multi[slugifiedName] = kitspaceYamlJson.multi[subProjectName]
        delete kitspaceYamlJson.multi[subProjectName]
      }
    })
  }

  return kitspaceYamlJson
}

async function getGitHash(checkoutDir) {
  const { stdout } = await exec(`cd '${checkoutDir}' && git rev-parse HEAD`)
  return stdout.slice(0, -1)
}

function tryReadFile(filePath) {
  return readFile(filePath).catch(err => {
    // just return an empty string if the file doesn't exist
    if (err.code === 'ENOENT') {
      return ''
    }
    throw err
  })
}

async function sync(gitDir, checkoutDir) {
  console.log("syncing")
  if (existsSync(checkoutDir)) {
    await exec(`cd ${checkoutDir} && git pull`).catch(err => {
      // repos with no branches yet will create this error
      if (
        err.stderr ===
        "Your configuration specifies to merge with the ref 'refs/heads/master'\nfrom the remote, but no such ref was fetched.\n"
      ) {
        log.warn('repo without any branches', checkoutDir)
        return err
      }
      throw err
    })
  } else {
    console.log("In this branch")
    try {
      console.log(execSync(`ls -lah ${checkoutDir}`))
    } catch (e) {
      console.log('ignore ls')
    }
    execSync(`git clone ${gitDir} ${checkoutDir}`)
    log.debug('cloned into', checkoutDir)
  }
}
