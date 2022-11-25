import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { object, string } from 'prop-types'
import { SWRConfig } from 'swr'
import useSWRInfinite, { unstable_serialize } from 'swr/infinite'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import ProjectCardGrid, {
  getKey,
  gridFetcher,
  useUpdateBeforeReachingLimit,
} from '@components/ProjectCardGrid'

import styles from './index.module.scss'

export const getServerSideProps: GetServerSideProps = async ({
  query: queryParams,
}) => {
  // '*' or '' means return everything but '' can't be used as a SWR cache key
  const query = (queryParams.q as string) || '*'

  const hits = await gridFetcher({ query })

  return {
    props: {
      swrFallback: {
        [unstable_serialize(getKey({ query }))]: hits,
      },
      initialQuery: query,
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
  const { data, setSize } = useSWRInfinite(getKey({ query }), gridFetcher)
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
    <ProjectCardGrid
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
