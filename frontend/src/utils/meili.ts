import { MeiliSearch, Index } from 'meilisearch'
import getConfig from 'next/config'

const { KITSPACE_MEILISEARCH_URL, meiliApiKey } = getConfig().publicRuntimeConfig

interface NoApiKeyIndex {
  search: () => Promise<never>
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let index: Index<any> | NoApiKeyIndex = {
  async search() {
    throw Error('Search performed but meiliApiKey was not set')
  },
}

if (meiliApiKey) {
  const client = new MeiliSearch({
    host: KITSPACE_MEILISEARCH_URL,
    apiKey: meiliApiKey,
  })
  index = client.index('projects')
} else {
  console.warn('No meiliApiKey available.')
}

export const meiliIndex = index
