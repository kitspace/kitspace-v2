import { watch } from './watcher.js'
import { checkPartInfoHealth } from './healthChecks.js'
import { createWorkers } from './workers.js'

export interface KitspaceProcessorApp {
  cleanup: Array<() => Promise<void>>
  stop: () => Promise<void>
}

export async function createApp(repoDir: string): Promise<KitspaceProcessorApp> {
  const app: KitspaceProcessorApp = {
    cleanup: [],
    async stop() {
      await Promise.all(this.cleanup.map(cleanupFunction => cleanupFunction()))
    },
  }

  await checkPartInfoHealth()

  const unwatch = await watch(repoDir)
  app.cleanup.push(unwatch)

  const stopWorkers = createWorkers()
  app.cleanup.push(stopWorkers)

  return app
}
