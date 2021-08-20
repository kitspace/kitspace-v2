import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { arrayOf, object, string } from 'prop-types'

import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'
import { useSearchRepos } from '@hooks/Gitea'
import { useSearchQuery } from '@contexts/SearchContext'
import { getAllRepos, searchRepos } from '@utils/giteaApi'
import ProjectCard from '@components/ProjectCard'
import { getFlatProjects } from '@utils/projectPage'

import styles from './search.module.scss'

export const getServerSideProps = async ({ query }) => {
  const { q } = query
  if (q) {
    return {
      props: {
        initialProjects: await getFlatProjects(await searchRepos(q)),
        initialQuery: q,
      },
    }
  }
  return {
    props: {
      initialProjects: await getFlatProjects(await getAllRepos()),
    },
  }
}

const Search = ({ initialProjects, initialQuery }) => {
  return (
    <Page initialQuery={initialQuery} title="Kitspace | Home">
      <CardsGrid initialProjects={initialProjects} />
    </Page>
  )
}

const CardsGrid = ({ initialProjects }) => {
  const { query } = useSearchQuery()
  const initialDataRef = useRef()

  const {
    repos: projects,
    mutate,
    isLoading,
  } = useSearchRepos(query, {
    initialData: initialDataRef.current ? initialDataRef.current : initialProjects,
    revalidateOnMount: false,
    revalidateOnFocus: false,
  })

  // Prevent flickering initial data while revalidating.
  // see https://github.com/vercel/swr/issues/192#issuecomment-821848756.
  if (projects !== undefined && initialDataRef) {
    initialDataRef.current = projects
  }

  useEffect(() => {
    mutate()
  }, [query, mutate])

  if (isLoading) {
    return <Loader active>Searching...</Loader>
  }

  if (projects?.length === 0) {
    return (
      <p className={styles.noMatching}>
        Sorry, no result. <Link href="/projects/new">Add your project!</Link>
      </p>
    )
  }

  return (
    <div>
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
