import React from 'react'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { SWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'

import Page from '@components/Page'
import Project from '@models/Project'
import {
  makeSWRKeyGetter,
  searchFetcher,
  useLazySearch,
} from '@hooks/useLazySearch'
import ProjectCardGrid from '@components/ProjectCardGrid'
import { useSearchQuery } from '@contexts/SearchContext'

import styles from './index.module.scss'

interface SearchPageProps {
  initialQuery: string
  swrFallback: Record<string, Array<Array<Project>>>
}

export const getServerSideProps: GetServerSideProps = async ({
  query: queryParams,
}) => {
  const query = (queryParams.q as string) || ''

  const searchParams = { query }

  const hits = await searchFetcher(searchParams)
  const props: SearchPageProps = {
    swrFallback: {
      // unstable_serialize is clever enough to turn our key getter function into the right string key
      [unstable_serialize(makeSWRKeyGetter(searchParams))]: [hits],
    },
    initialQuery: query,
  }

  return {
    props,
  }
}

const Search = ({ swrFallback, initialQuery }: SearchPageProps) => {
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
  const { projects, intersectionObserverRef } = useLazySearch({ query })
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

export default Search
