import { watch } from './watcher.js'
import { createWorkers } from './workers.js'

export interface KitspaceProcessorApp {
  cleanup: Array<() => Promise<void>>
  stop: () => Promise<void>
}

export function createApp(repoDir: string): KitspaceProcessorApp {
  const app: KitspaceProcessorApp = {
    cleanup: [],
    async stop() {
      await Promise.all(this.cleanup.map(cleanupFunction => cleanupFunction()))
    },
  }

  const unwatch = watch(repoDir)
  app.cleanup.push(unwatch)

  const stopWorkers = createWorkers()
  app.cleanup.push(stopWorkers)

  return app
}
