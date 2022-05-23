import React, { useContext } from 'react'
import Link from 'next/link'
import { object, string } from 'prop-types'
import { MeiliSearch } from 'meilisearch'
import useSWR, { SWRConfig } from 'swr'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import { AuthContext } from '@contexts/AuthContext'
import ProjectCard from '@components/ProjectCard'

import styles from './index.module.scss'

const fetcher = async (query, meiliApiKey) => {
  const meili = new MeiliSearch({
    host: process.env.KITSPACE_MEILISEARCH_URL,
    apiKey: meiliApiKey,
  })
  const index = meili.index('projects')
  const searchResult = await index.search(query)
  return searchResult.hits
}

export const getServerSideProps = async ({ query, req }) => {
  // '*' or '' means return everything but '' can't be used as a SWR cache key
  const { q = '*' } = query

  const hits = await fetcher(q, req.session.meiliApiKey)

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
  const { meiliApiKey } = useContext(AuthContext)
  const { data: projects } = useSWR(query || '*', query =>
    fetcher(query, meiliApiKey),
  )

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
    <div data-cy="cards-grid">
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
