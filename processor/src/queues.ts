import AsyncLock from 'async-lock'
import bullmq from 'bullmq'
import log from 'loglevel'
import path from 'node:path'
import { DATA_DIR } from './env.js'
import { JobData } from './job.js'
import { getKitspaceYaml } from './kitspaceYaml.js'
import redisConnection from './redisConnection.js'
import { execEscaped, exists } from './utils.js'

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
  repoDescription: string
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
  const inputDir = path.join(DATA_DIR, 'checkout', ownerName, repoName)

  await sync(gitDir, inputDir)

  const hash = await getGitHash(inputDir)
  const outputDir = path.join(DATA_DIR, 'files', ownerName, repoName, hash)

  await execEscaped(['mkdir', '-p', outputDir])

  const kitspaceYamlArray = await getKitspaceYaml(inputDir)

  await writeKitspaceYamlQueue.add(
    'projectAPI',
    { kitspaceYamlArray, outputDir },
    { jobId: outputDir },
  )

  for (const kitspaceYaml of kitspaceYamlArray) {
    const projectOutputDir = path.join(outputDir, kitspaceYaml.name)
    // fall back to repo description if there's no summary.
    kitspaceYaml.summary ||= repoDescription

    createJobs({
      defaultBranch,
      subprojectName: kitspaceYaml.name,
      giteaId,
      inputDir,
      kitspaceYaml,
      outputDir: projectOutputDir,
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

async function getGitHash(checkoutDir) {
  const { stdout } = await execEscaped(['git', 'rev-parse', 'HEAD'], {
    cwd: checkoutDir,
  })
  return stdout.slice(0, -1)
}

const lock = new AsyncLock()
async function sync(gitDir, checkoutDir) {
  await lock
    .acquire(gitDir, async done => {
      log.info('Acquired sync lock for ', gitDir)

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
        log.debug('Cloning ', gitDir)
        await execEscaped(['git', 'clone', gitDir, checkoutDir]).catch(err => {
          if (err.stderr) {
            done(err)
          }
        })
        log.debug('Cloned into', checkoutDir)
      }
      done()
    })
    .then(() => log.debug('Released sync lock for ', gitDir))
}
