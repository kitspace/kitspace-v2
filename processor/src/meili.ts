import { MeiliSearch, type Settings } from 'meilisearch'
import { MEILI_MASTER_KEY } from './env.js'

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
await meiliIndex.update({ primaryKey: 'id' })
await meiliIndex.updateSettings(meiliSettings)
