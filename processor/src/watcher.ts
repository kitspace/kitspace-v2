import * as chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import log from 'loglevel'
import path from 'node:path'
import * as giteaDB from './giteaDB.js'
import { addProjectToQueues, stopQueues } from './queues.js'

export function watch(repoDir) {
  let dirWatchers = {}

  // watch repositories for file-system events and process the project
  const handleAddDir = gitDir => {
    log.debug('addDir', gitDir)

    dirWatchers[gitDir] = {}

    // we debounce the file-system event to only invoke once per change in the repo
    const debouncedAddToQueues = debounce(async () => {
      if (dirWatchers[gitDir] != null && !dirWatchers[gitDir].queuing) {
        dirWatchers[gitDir].queuing = true

        // '/repositories/user/project.git' -> ['user', 'project']
        const [lowercaseOwner, lowercaseRepo] = path
          .relative(repoDir, gitDir)
          .slice(0, -4)
          .split('/')

        let giteaRepo = await giteaDB.getRepoInfo(lowercaseOwner, lowercaseRepo)
        if (giteaRepo == null) {
          log.error(`${lowercaseOwner}/${lowercaseRepo} is not in giteaDB`)
          // dirWatchers[gitDir] can be deleted from the unlinkDir callback below
          if (dirWatchers[gitDir] != null) {
            dirWatchers[gitDir].queuing = false
          }
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
        giteaRepo = await giteaDB.getRepoInfo(lowercaseOwner, lowercaseRepo)
        const originalUrl = giteaRepo.original_url
        const repoDescription = giteaRepo.description
        const defaultBranch = giteaRepo.default_branch
        // use case-correct names from the DB
        const ownerName = giteaRepo.owner_name
        const repoName = giteaRepo.name

        await addProjectToQueues({
          defaultBranch,
          originalUrl,
          ownerName,
          repoName,
          repoDescription,
          giteaId,
          gitDir,
        })

        // dirWatchers[gitDir] can be deleted from the unlinkDir callback below
        if (dirWatchers[gitDir] != null) {
          dirWatchers[gitDir].queuing = false
        }
      }
    }, 1000)

    dirWatchers[gitDir].add = chokidar.watch(gitDir).on('add', debouncedAddToQueues)

    // if the repo is moved or deleted we clean up the watcher
    dirWatchers[gitDir].unlinkDir = chokidar.watch(gitDir).on('unlinkDir', dir => {
      if (dir === gitDir) {
        log.debug('deleting', gitDir)
        dirWatchers[gitDir].add.close()
        dirWatchers[gitDir].unlinkDir.close()
        delete dirWatchers[gitDir]
      }
    })
  }

  const repoWildcard = path.join(repoDir, '*', '*')
  let watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)

  // re-scan every minute in case we missed a file-system event
  const timer = setInterval(() => {
    watcher.close()
    for (const gitDir of Object.keys(dirWatchers)) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    dirWatchers = {}
    watcher = chokidar.watch(repoWildcard).on('addDir', handleAddDir)
  }, 60_000)

  const unwatch = async () => {
    clearInterval(timer)
    watcher.close()
    for (const gitDir of Object.keys(dirWatchers)) {
      dirWatchers[gitDir].add.close()
      dirWatchers[gitDir].unlinkDir.close()
    }
    await stopQueues()
  }

  return unwatch
}
