import { MeiliSearch, type Settings } from 'meilisearch'
import { MEILI_MASTER_KEY } from './env.js'
import { log } from './log.js'
import { waitFor } from './utils.js'

const meiliSettings: Settings = {
  distinctAttribute: 'id',
  filterableAttributes: ['id', 'repoId', 'gitHash', 'ownerName'],
  searchableAttributes: [
    'projectName',
    'summary',
    'bom',
    'readme',
    'ownerName',
    'repoName',
  ],
  sortableAttributes: ['createdUnix', 'updatedUnix'],
  displayedAttributes: ['id', 'ownerName', 'projectName', 'repoName', 'summary'],
}

const meili = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: MEILI_MASTER_KEY,
})

export const meiliIndex = meili.index('projects')

try {
  await meiliIndex.getRawInfo()
  log.info('meilisearch: using existing index')
} catch (e) {
  log.info('meilisearch: creating index')
  const { taskUid } = await meili.createIndex('projects', { primaryKey: 'id' })
  await waitFor<ReturnType<typeof meili.getTask>>(() => meili.getTask(taskUid), {
    timeoutMs: 10000,
    checkFn: x => x.status === 'succeeded',
  })
}

await meiliIndex.updateSettings(meiliSettings)
