import { MeiliSearch } from 'meilisearch'
import { SearchParams, SearchResponse } from 'meilisearch/src/types'

export type SearchOptions = {
  meiliApiKey: string
} & SearchParams

export function search(
  query: string,
  { meiliApiKey, ...options }: SearchOptions,
): Promise<SearchResponse> {
  const client = new MeiliSearch({
    host: process.env.NEXT_PUBLIC_KITSPACE_MEILISEARCH_URL,
    apiKey: meiliApiKey,
  })
  const index = client.index('projects')
  return index.search(query, options)
}
