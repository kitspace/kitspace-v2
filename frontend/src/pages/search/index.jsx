import React, { useEffect } from 'react'
import Link from 'next/link'
import { object, string } from 'prop-types'
import { SWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { useInView } from 'react-intersection-observer'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import ProjectCard from '@components/ProjectCard'
import { meiliIndex } from '@utils/meili'

import styles from './index.module.scss'

const cardsPerRow = 3
const limit = cardsPerRow * 6

const getKey = query => (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.length) {
    return null // reached the end
  }
  return { query, offset: pageIndex * limit, limit }
}

const fetchSearch = async ({ query, offset, limit }) => {
  const searchResult = await meiliIndex.search(query, { limit, offset })
  return searchResult.hits
}

export const getServerSideProps = async ({ query }) => {
  // '*' or '' means return everything but '' can't be used as a SWR cache key
  const { q = '*' } = query

  const hits = await fetchSearch({ query: q, limit, offset: 0 })

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
        <CardsGrid />
      </Page>
    </SWRConfig>
  )
}

const CardsGrid = () => {
  const { query } = useSearchQuery()
  const { data, setSize } = useSWRInfinite(getKey(query || '*'), fetchSearch, {
    revalidateFirstPage: false,
  })
  const projects = data?.flat()
  const [ref, isReachingLimit] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (isReachingLimit) {
      setSize(size => size + 1)
    }
  }, [isReachingLimit, setSize])

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
    <div className={styles.cardsGrid} data-cy="cards-grid">
      {projects?.map((project, index) => (
        <ProjectCard
          {...project}
          key={project.id}
          ref={index === projects.length - cardsPerRow * 2 ? ref : null}
        />
      ))}
    </div>
  )
}

Search.propTypes = {
  swrFallback: object.isRequired,
  initialQuery: string,
}

export default Search
