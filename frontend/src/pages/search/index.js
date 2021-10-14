import React, { useContext, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { arrayOf, object, string } from 'prop-types'
import { isEqual } from 'lodash'

import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'
import { useSearchRepos } from '@hooks/Gitea'
import { useSearchQuery } from '@contexts/SearchContext'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos, searchRepos } from '@utils/giteaApi'
import ProjectCard from '@components/ProjectCard'
import { getFlatProjects } from '@utils/projectPage'

import styles from './index.module.scss'

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
  const { user } = useContext(AuthContext)

  const username = user?.login ?? 'unknown user'

  return (
    <Page initialQuery={initialQuery} title="Kitspace | Home">
      <div style={{ paddingBottom: '2rem' }}>Hi there {username}</div>
      <CardsGrid initialProjects={initialProjects} />
    </Page>
  )
}

const CardsGrid = ({ initialProjects }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { query } = useSearchQuery()
  const initialDataRef = useRef()

  const { repos: projects, mutate } = useSearchRepos(query, {
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
    const isSearchWithSwr = !isEqual(initialProjects, initialDataRef.current)
    if (isSearchWithSwr) {
      // Only show the loader if swr was used, i.e., don't show the loader for SSR mode.
      setIsLoading(true)
    }
    // When the query changes, revalidate projects.
    mutate().then(
      /*
      ! useSearchRepos().isLoading can't be used for the loading state;
      ! using initialData make data always truthy so ` useSearchRepos().isLoading` is never true.
      ! it's the same problem `initialDataRef` workaround is used to solve another consequence of it.
      */
      // When the revalidation is done set `isLoading=false`.
      () => setIsLoading(false),
    )
  }, [query, mutate, initialProjects])

  if (isLoading) {
    return <Loader active>Searching...</Loader>
  }

  if (projects?.length === 0) {
    return (
      <p className={styles.noMatching}>
        Sorry, no result.{' '}
        <Link href="/projects/new">
          <a>Add your project!</a>
        </Link>
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
