import { MeiliSearch } from 'meilisearch'
import { SearchParams, SearchResponse } from 'meilisearch/src/types'
import getConfig from 'next/config'
const { KITSPACE_MEILISEARCH_URL } = getConfig().publicRuntimeConfig

export type SearchOptions = {
  meiliApiKey: string
} & SearchParams

export function search(
  query: string,
  { meiliApiKey, ...options }: SearchOptions,
): Promise<SearchResponse> {
  const client = new MeiliSearch({
    host: KITSPACE_MEILISEARCH_URL,
    apiKey: meiliApiKey,
  })
  const index = client.index('projects')
  return index.search(query, options)
}
