import React from 'react'
import Link from 'next/link'
import { object, string } from 'prop-types'
import useSWR, { SWRConfig } from 'swr'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import ProjectCard from '@components/ProjectCard'
import { meiliIndex } from '@utils/meili'

import styles from './index.module.scss'

const fetchSearch = async query => {
  const searchResult = await meiliIndex.search(query)
  return searchResult.hits
}

export const getServerSideProps = async ({ query }) => {
  // '*' or '' means return everything but '' can't be used as a SWR cache key
  const { q = '*' } = query

  const hits = await fetchSearch(q)

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
  const { data: projects } = useSWR(query || '*', fetchSearch, {
    refreshInterval: 1000,
  })

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
      {projects?.map(project => (
        <ProjectCard {...project} key={project.id} />
      ))}
    </div>
  )
}

Search.propTypes = {
  swrFallback: object.isRequired,
  initialQuery: string,
}

export default Search
