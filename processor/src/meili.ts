import { MeiliSearch, Settings } from 'meilisearch'
import { MEILI_MASTER_KEY } from './env.js'

const meiliSettings: Settings = {
  filterableAttributes: ['id', 'repoId', 'gitHash', 'ownerName'],
  searchableAttributes: [
    'projectName',
    'summary',
    'bom',
    'readme',
    'ownerName',
    'repoName',
  ],
}

const meili = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: MEILI_MASTER_KEY,
})
export const meiliIndex = meili.index('projects')
meiliIndex.updateSettings(meiliSettings)
