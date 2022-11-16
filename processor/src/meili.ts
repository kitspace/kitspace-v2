import { MeiliSearch } from 'meilisearch'
import { meiliSettings } from './tasks/addToSearch.js'
import { MEILI_MASTER_KEY } from './env.js'

export function createMeili() {
  const meili = new MeiliSearch({
    host: 'http://meilisearch:7700',
    apiKey: MEILI_MASTER_KEY,
  })
  const index = meili.index('projects')
  index.updateSettings(meiliSettings)
  return index
}
