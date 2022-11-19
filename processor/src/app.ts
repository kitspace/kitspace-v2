import { InjectedDependencies } from './injectedDependencies.js'
import { watch } from './watcher.js'
import { createWorkers } from './workers.js'

export interface KitspaceProcessorApp {
  cleanup: Array<() => Promise<void>>
  stop: () => Promise<void>
}

export function createApp(
  repoDir: string,
  { giteaDB, meiliIndex }: InjectedDependencies,
): KitspaceProcessorApp {
  const app: KitspaceProcessorApp = {
    cleanup: [],
    async stop() {
      await Promise.all(this.cleanup.map(cleanupFunction => cleanupFunction()))
    },
  }

  const unwatch = watch(repoDir, { giteaDB })
  app.cleanup.push(unwatch)

  const stopWorkers = createWorkers({ giteaDB, meiliIndex })
  app.cleanup.push(stopWorkers)

  return app
}
