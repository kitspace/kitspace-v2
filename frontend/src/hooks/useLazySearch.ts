import { useEffect } from 'react'
import useSWRInfinite from 'swr/infinite'
import { useInView } from 'react-intersection-observer'
import { Filter } from 'meilisearch'

import { meiliIndex } from '@utils/meili'
import Project from '@models/Project'

interface SearchParams {
  query: string
  filter?: Filter
}

interface SearchSWRKeyParams extends SearchParams {
  limit: number
  offset: number
}

export const cardsPerRow = 3
const defaultLimit = cardsPerRow * 6

export const makeSWRKeyGetter =
  ({ query, filter }: SearchParams) =>
  (pageIndex: number, previousPageData: Array<Project>): SearchSWRKeyParams => {
    if (previousPageData && !previousPageData.length) {
      // reached the end
      return null
    }
    return { query, offset: pageIndex * defaultLimit, limit: defaultLimit, filter }
  }

export type SearchFetcherParams = Partial<SearchSWRKeyParams>

export const searchFetcher = async ({
  filter,
  offset = 0,
  query = '',
  limit = defaultLimit,
}: SearchFetcherParams) => {
  const searchResult = await meiliIndex.search(query, { limit, offset, filter })
  return searchResult.hits as Array<Project>
}

/**
 * Get projects from MeiliSearch lazily.
 */
export const useLazySearch = (params: SearchParams) => {
  const [ref, isReachingLimit] = useInView({ triggerOnce: true })
  const { data, setSize } = useSWRInfinite(makeSWRKeyGetter(params), searchFetcher)

  useEffect(() => {
    if (isReachingLimit) {
      setSize(size => size + 1)
    }
  }, [isReachingLimit, setSize])

  return { projects: data?.flat(), intersectionObserverRef: ref }
}
