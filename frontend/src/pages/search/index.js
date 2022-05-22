import React, { useEffect, useState, useContext } from 'react'
import Link from 'next/link'
import { arrayOf, object, string } from 'prop-types'
import { MeiliSearch } from 'meilisearch'

import Page from '@components/Page'
import { useSearchQuery } from '@contexts/SearchContext'
import { AuthContext } from '@contexts/AuthContext'
import ProjectCard from '@components/ProjectCard'

import styles from './index.module.scss'

export const getServerSideProps = async ({ query, req }) => {
  const { q } = query

  const searchResult = await req.meiliIndex.search(q)

  return {
    props: {
      initialProjects: searchResult.hits,
      initialQuery: q || '',
    },
  }
}

const Search = ({ initialProjects, initialQuery }) => {
  return (
    <Page initialQuery={initialQuery} title="Kitspace">
      <CardsGrid initialProjects={initialProjects} />
    </Page>
  )
}

const CardsGrid = ({ initialProjects }) => {
  const [projects, setProjects] = useState(initialProjects)
  const { query } = useSearchQuery()
  const { meiliApiKey } = useContext(AuthContext)

  useEffect(() => {
    const meili = new MeiliSearch({
      host: process.env.KITSPACE_MEILISEARCH_URL,
      apiKey: meiliApiKey,
    })
    const index = meili.index('projects')
    index.search(query).then(result => {
      setProjects(result.hits)
    })
  }, [query, meiliApiKey])

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
  initialProjects: arrayOf(object).isRequired,
  initialQuery: string,
}

CardsGrid.propTypes = {
  initialProjects: arrayOf(object).isRequired,
}

export default Search
