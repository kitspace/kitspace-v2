import debounce from 'lodash.debounce'
import * as giteaDB from './giteaDB.js'
import { log } from './log.js'
import { addProjectToQueues, stopQueues } from './queues.js'

const addToQueues = debounce(
  async (giteaRepo: giteaDB.RepoInfo, repoDir: string) => {
    let ownerName = giteaRepo.owner_name.toLowerCase()
    let repoName = giteaRepo.name.toLocaleLowerCase()

    if (giteaRepo == null) {
      log.error(`${ownerName}/${repoName} is not in giteaDB`)
      // dirWatchers[gitDir] can be deleted from the unlinkDir callback below
      return
    }

    const giteaId = giteaRepo.id

    if (giteaRepo.is_empty) {
      await giteaDB.waitForNonEmpty(giteaId)
    }

    if (giteaRepo.is_mirror) {
      await giteaDB.waitForRepoMigration(giteaId)
    }

    // Get the repo info again after the migration is done.
    // Some fields, (e.g., default_branch) only gets populated after migration
    giteaRepo = await giteaDB.getRepoInfo(ownerName, repoName)
    const gitDir = `${repoDir}/${ownerName}/${repoName}.git`
    const originalUrl = giteaRepo.original_url
    const repoDescription = giteaRepo.description
    const defaultBranch = giteaRepo.default_branch

    // use case-correct names from the DB
    ownerName = giteaRepo.owner_name
    repoName = giteaRepo.name

    await addProjectToQueues({
      defaultBranch,
      originalUrl,
      ownerName,
      repoName,
      repoDescription,
      giteaId,
      gitDir,
    })
  },
  1000,
)

export async function watch(repoDir: string) {
  await addToQueuesOnStartUp(repoDir)
  const reposBeingQueued = new Set<string>()

  const { unsubscribe } = await giteaDB.subscribeToRepo(async (repo, info) => {
    if (info.command === 'delete') {
      // We don't subscribe to repo deletions.
      return
    }

    if (!reposBeingQueued.has(repo.id)) {
      reposBeingQueued.add(repo.id)
      await addToQueues(repo as giteaDB.RepoInfo, repoDir)
      reposBeingQueued.delete(repo.id)
    }
  })

  const unwatch = async () => {
    unsubscribe()
    await stopQueues()
  }
  return unwatch
}

async function addToQueuesOnStartUp(repoDir: string) {
  const repos = await giteaDB.getAllReposInfo()
  for (const repo of repos) {
    await addToQueues(repo, repoDir)
  }
}
