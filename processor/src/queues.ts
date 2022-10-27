import AsyncLock from 'async-lock'
import bullmq from 'bullmq'
import jsYaml from 'js-yaml'
import log from 'loglevel'
import path from 'node:path'
import { DATA_DIR } from './env.js'
import { exists, execEscaped, readFile } from './utils.js'
import { JobData } from './jobData.js'
import redisConnection from './redisConnection.js'

const defaultJobOptions: bullmq.JobsOptions = {
  // keep completed jobs for an hour
  // we update progress on jobs asynchonously when the task promise may have already been
  // completed so we should never remove completed jobs right away as it will cause errors
  removeOnComplete: { age: 3600 },
  // keep the last 5000 failed jobs
  removeOnFail: { count: 5000 },
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
  defaultBranch: string
  originalUrl: string
  ownerName: string
  repoName: string
  repoDescription: string,
  giteaId: string
  gitDir: string
}
export async function addProjectToQueues({
  defaultBranch,
  originalUrl,
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

  await sync(gitDir, inputDir)

  const hash = await getGitHash(inputDir)
  const outputDir = path.join(
    DATA_DIR,
    'files',
    ownerName.toLowerCase(),
    repoName.toLowerCase(),
    hash,
  )

  await execEscaped(['mkdir', '-p', outputDir])

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
        defaultBranch,
        subprojectName,
        giteaId,
        inputDir,
        kitspaceYaml: projectKitspaceYaml,
        outputDir: projectOutputDir,
        originalUrl,
        ownerName,
        repoName,
        hash,
      })
    }
  } else {
    // fall back to repo description if there's no summary.
    kitspaceYaml.summary ||= repoDescription
    createJobs({
      defaultBranch,
      giteaId,
      inputDir,
      kitspaceYaml,
      outputDir,
      originalUrl,
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
      const slugifiedName = formatAsGiteaRepoName(subProjectName)
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
  const { stdout } = await execEscaped(['git', 'rev-parse', 'HEAD'], { cwd: checkoutDir })
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

const lock = new AsyncLock()
async function sync(gitDir, checkoutDir) {
  await lock.acquire(gitDir, async (done) => {
    log.info("Acquired sync lock for ", gitDir)

    if (await exists(checkoutDir)) {
      log.debug('Pulling updates for', gitDir)
      await execEscaped(['git', 'pull'], { cwd: checkoutDir }).catch(err => {
        // repos with no branches yet will create this error
        if (
          err.stderr ===
          "Your configuration specifies to merge with the ref 'refs/heads/master'\nfrom the remote, but no such ref was fetched.\n"
        ) {
          log.warn('repo without any branches', checkoutDir)
          done()
        }
        done(err)
      })
    } else {
      log.debug("Cloning ", gitDir)
      await execEscaped(['git', 'clone', gitDir, checkoutDir]).catch(err => {
        if (err.stderr) {
          done(err)
        }
      })
      log.debug('Cloned into', checkoutDir)
    }
    done()
  }).then(() => log.debug('Released sync lock for ', gitDir))
}

/**
 * format subproject name as a valid gitea repo name.
 * This replaces any **non* (alphanumeric, -, _, and .) with a '-',
 * see https://github.com/go-gitea/gitea/blob/b59b0cad0a550223f74add109ff13c0d2f4309f3/services/forms/repo_form.go#L35
 * @param subProjectName
 */
function formatAsGiteaRepoName(subProjectName: string) {
  return subProjectName.replace(/[^\w\d-_.]/g, '-').slice(0, 100)
}
