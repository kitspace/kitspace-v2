import AsyncLock from 'async-lock'
import bullmq, { FlowProducer } from 'bullmq'
import fs from 'node:fs/promises'
import path from 'node:path'
import { DATA_DIR, PROCESSOR_ASSET_VERSION } from './env.js'
import { exists } from './utils.js'
import { ProjectJobData, RepoJobData } from './job.js'
import { KitspaceYaml, getKitspaceYaml } from './kitspaceYaml.js'
import { log } from './log.js'
import { meiliIndex } from './meili.js'
import { sh } from './shell.js'
import * as s3 from './s3.js'
import redisConnection from './redisConnection.js'
import registryBoards from './registry.js'

const defaultJobOptions: bullmq.JobsOptions = {
  // keep completed jobs for an hour
  // we update progress on jobs asynchronously when the task promise may have already been
  // completed so we should never remove completed jobs right away as it will cause errors
  removeOnComplete: { age: 3600 },
  // keep the last 5000 failed jobs
  removeOnFail: { count: 5000 },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}

const projectQueues: Array<bullmq.Queue> = []

const writeKitspaceYamlQueue = new bullmq.Queue('writeKitspaceYaml', {
  connection: redisConnection,
  defaultJobOptions,
})

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

const cleanUpQueue = new bullmq.Queue('cleanUp', {
  connection: redisConnection,
  defaultJobOptions,
})

const repoProcessingFlow = new FlowProducer({ connection: redisConnection })

/**
 * Create jobs for each project in a repo, and when all projects are done, clean up the checkout and the output dir.
 */
async function createJobs(jobData: RepoJobData) {
  const jobId = jobData.outputDir

  const childJobs = jobData.kitspaceYamlArray
    .map(kitspaceYaml => {
      const projectOutputDir = path.join(jobData.outputDir, kitspaceYaml.name)
      kitspaceYaml.summary = kitspaceYaml.summary || jobData.repoDescription
      const data: ProjectJobData = {
        ...jobData,
        kitspaceYaml,
        outputDir: projectOutputDir,
        subprojectName: kitspaceYaml.name,
      }

      return projectQueues.map(q => ({
        data,
        name: 'projectAPI',
        opts: { jobId: projectOutputDir },
        queueName: q.name,
      }))
    })
    .flat()

  await repoProcessingFlow.add({
    children: childJobs,
    data: jobData,
    name: 'projectAPI',
    /*
     * We have to use a unique jobId for the cleanup job, whenever we recreate it;
     * There are cases where the repo gets re-cloned (the processor clones the repo again)
     * and if we use the same jobId the cleanup job will be ignored.
     * An example of this is when the processing fails (for three times),
     * the cleanup job will get created, whenever the processor gets restarted (for whatever reason)
     * it will process the repo again (all repos are processed on startup according to
     * the rules implemented in `alreadyProcessed`).
     * If the jobId is still in redis it won't run the cleanup job.
     * So we timestamp it to make sure it's unique for each time the repo gets cloned.
     */
    opts: { jobId: `${jobId}-${Date.now()}` },
    queueName: cleanUpQueue.name,
  })
}

export interface AddProjectToQueueData {
  defaultBranch: string
  originalUrl: string
  ownerName: string
  repoName: string
  repoDescription: string
  giteaId: string
  gitDir: string
  updatedUnix: string
  createdUnix: string
}
export async function addProjectToQueues({
  defaultBranch,
  originalUrl,
  ownerName,
  repoName,
  repoDescription,
  giteaId,
  gitDir,
  updatedUnix,
  createdUnix,
}: AddProjectToQueueData) {
  const inputDir = path.join(DATA_DIR, 'checkout', ownerName, repoName)

  try {
    await sync(gitDir, inputDir)
  } catch (e) {
    log.warn('Released lock for', gitDir, 'after error:', e)
    return
  }

  try {
    const hash = await getGitHash(inputDir)
    const outputDir = path.join(
      DATA_DIR,
      PROCESSOR_ASSET_VERSION,
      ownerName,
      repoName,
      hash,
    )

    const kitspaceYamlArray = await getKitspaceYaml(inputDir)

    if (await alreadyProcessed(outputDir, kitspaceYamlArray, giteaId, hash)) {
      // Early return if the project is already in S3 and indexed
      fs.rm(inputDir, { recursive: true }).catch(err =>
        log.error(`failed to clean up ${inputDir}: ${err}`),
      )
      return
    }

    await fs.mkdir(outputDir, { recursive: true })

    await createJobs({
      defaultBranch,
      giteaId,
      hash,
      inputDir,
      kitspaceYamlArray,
      originalUrl,
      outputDir,
      ownerName,
      repoDescription,
      repoName,
      updatedUnix,
      createdUnix,
    })

    await writeKitspaceYamlQueue.add(
      'projectAPI',
      { kitspaceYamlArray, outputDir },
      { jobId: outputDir },
    )
  } catch (e) {
    log.error(e)
  }
}

export async function stopQueues() {
  const qs = projectQueues.concat([writeKitspaceYamlQueue])
  await Promise.all(qs.map(q => q.obliterate({ force: true })))
}

async function getGitHash(checkoutDir: string) {
  const { stdout } = await sh`cd ${checkoutDir} && git rev-parse HEAD`
  return stdout.slice(0, -1)
}

const lock = new AsyncLock()
async function sync(gitDir, checkoutDir) {
  await lock
    .acquire(gitDir, async () => {
      log.info('Acquired lock for ', gitDir)

      const registryHash = getRegistryHash(gitDir)

      if (await exists(checkoutDir)) {
        if (registryHash != null) {
          // no need to pull if we aren't going to use the latest commit
          return
        }

        log.debug('Pulling updates for', gitDir)
        try {
          await sh`cd ${checkoutDir} && git pull`
        } catch (err) {
          // repos with no branches yet will create this error
          if (
            err.stderr ===
            "Your configuration specifies to merge with the ref 'refs/heads/master'\nfrom the remote, but no such ref was fetched.\n"
          ) {
            log.warn('repo without any branches', checkoutDir)
          }
        }
      } else {
        log.debug('Cloning ', gitDir)
        try {
          await sh`git clone ${gitDir} ${checkoutDir}`
        } catch (err) {
          log.error(err)
          if (err.stderr) {
            return
          }
        }
        log.debug('Cloned into', checkoutDir)
        if (registryHash != null) {
          await sh`cd ${checkoutDir} && git checkout ${registryHash}`
            .then(() => log.debug(`reset ${gitDir} to ${registryHash}`))
            .catch(err => {
              log.error(
                new Error(`failed to reset ${gitDir} to ${registryHash}: ${err}`),
              )
            })
        }
      }
    })
    .then(() => log.debug('Released lock for ', gitDir))
}

/**
 * Checks if a version has been processed: the assets are in s3 and the hash is in the search index.
 *
 * @param s3BasePath - The base path for the version.
 */
async function alreadyProcessed(
  s3BasePath: string,
  kitspaceYamlArray: Array<KitspaceYaml>,
  repoId: string,
  gitHash: string,
) {
  const searchIndexResults = await meiliIndex.search('', {
    filter: `(repoId = ${repoId}) AND (gitHash = ${gitHash})`,
  })

  if (searchIndexResults.hits.length !== kitspaceYamlArray.length) {
    return false
  }

  const reports = await Promise.all(
    kitspaceYamlArray.map(async kitspaceYaml =>
      s3.exists(path.join(s3BasePath, kitspaceYaml.name, 'processor-report.json')),
    ),
  )
  const allReportsExist = reports.every(r => r)
  return allReportsExist
}

function getRegistryHash(localGitDir: string) {
  const repoFullName = localGitDir
    .split('/')
    .slice(-2)
    .join('/')
    .replace(/\.git$/, '')
  const registryBoard = registryBoards.find(b => b.repo.includes(repoFullName))

  return registryBoard ? registryBoard.hash : null
}
