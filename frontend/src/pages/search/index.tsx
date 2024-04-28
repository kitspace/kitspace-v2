import React from 'react'
import { GetServerSideProps } from 'next'
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
import SearchInput from '@components/SearchInput'
import { useSearchQuery } from '@contexts/SearchContext'

import styles from './index.module.scss'

interface SearchPageProps {
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
      // unstable_serialize is clever enough to turn our key getter function
      // into the right string key
      [unstable_serialize(makeSWRKeyGetter(searchParams))]: [hits],
    },
  }

  return {
    props,
  }
}

const Search = ({ swrFallback }: SearchPageProps) => {
  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <Page title="Kitspace">
        <PageContent />
      </Page>
    </SWRConfig>
  )
}

const PageContent = () => {
  const { query } = useSearchQuery()
  const { projects, intersectionObserverRef } = useLazySearch({ query })

  return (
    <>
      <SearchInput />
      {query === '' && <IntroText />}
      {projects.length === 0 ? (
        <p className={styles.noMatching} data-cy="cards-grid">
          {query ? `Sorry, no result for "${query}"` : 'No projects added yet.'}
        </p>
      ) : (
        <ProjectCardGrid
          intersectionObserverRef={intersectionObserverRef}
          projects={projects}
        />
      )}
    </>
  )
}

const IntroText = () => {
  return (
    <div className={styles.introTextContainer}>
      <div className={styles.introText}>
        Kitspace is a place to share ready-to-order electronics designs. We automate
        parts purchasing so you can focus on building.
      </div>
    </div>
  )
}

export default Search
