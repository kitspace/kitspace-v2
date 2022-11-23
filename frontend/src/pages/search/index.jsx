import React from 'react'
import Link from 'next/link'
import { object, string } from 'prop-types'
import { SWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import CardsGrid, {
  cardsPerRow,
  getKey,
  gridFetcher,
  useUpdateBeforeReachingLimit,
} from '@components/CardsGrid'

import styles from './index.module.scss'

export const getServerSideProps = async ({ query }) => {
  // '*' or '' means return everything but '' can't be used as a SWR cache key
  const { q = '*' } = query

  const hits = await gridFetcher({ query: q })

  return {
    props: {
      swrFallback: {
        [q]: hits,
      },
      initialQuery: q,
    },
  }
}

const Search = ({ swrFallback, initialQuery }) => {
  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <Page initialQuery={initialQuery} title="Kitspace">
        <PageContent />
      </Page>
    </SWRConfig>
  )
}

const PageContent = () => {
  const { query } = useSearchQuery()
  const { data, setSize } = useSWRInfinite(getKey(query || '*'), gridFetcher)
  const intersectionObserverRef = useUpdateBeforeReachingLimit(setSize)

  const projects = data?.flat()

  if (projects?.length === 0) {
    return (
      <p className={styles.noMatching} data-cy="cards-grid">
        Sorry, no result.{' '}
        <Link href="/projects/new">
          <a>Add your project!</a>
        </Link>
      </p>
    )
  }

  return (
    <CardsGrid
      cardsPerRow={cardsPerRow}
      intersectionObserverRef={intersectionObserverRef}
      projects={projects}
    />
  )
}

Search.propTypes = {
  swrFallback: object.isRequired,
  initialQuery: string,
}

export default Search
