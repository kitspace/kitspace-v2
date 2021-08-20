import React, { useContext, useEffect, useRef } from 'react'
import Link from 'next/link'
import { arrayOf, object, string } from 'prop-types'

import { Input, Form, Loader } from 'semantic-ui-react'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
import { useSearchRepos } from '@hooks/Gitea'
import { AuthContext } from '@contexts/AuthContext'
import SearchProvider, { useSearchQuery } from '@contexts/SearchContext'
import { getAllRepos, searchRepos } from '@utils/giteaApi'
import SearchFormModel from '@models/SearchFrom'
import ProjectCard from '@components/ProjectCard'
import { useRouter } from 'next/router'
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
  const { user } = useContext(AuthContext)

  const username = user?.login ?? 'unknown user'

  return (
    <Page title="Kitspace | Home">
      <div>Hi there {username}</div>
      <SearchProvider initialQuery={initialQuery}>
        <SearchForm />
        <CardsGrid initialProjects={initialProjects} />
      </SearchProvider>
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

const SearchForm = () => {
  const { form, onChange, formatErrorPrompt, populate } = useForm(SearchFormModel)
  const { push } = useRouter()
  const { updateQuery, query } = useSearchQuery()

  useEffect(() => {
    populate({ query })
  }, [populate, query])

  /**
   * i.   Update the search query in the {@link SearchProvider}.
   * ii.  Change the search query parameter `q`.
   * ii.  Make a `shallow` redirect to the new url `/search?q=${submitted query term}`.
   */
  const onSubmit = () => {
    updateQuery(form.query)
    push(`/search?q=${form.query}`, undefined, { shallow: true })
  }

  return (
    <div className={styles.searchForm}>
      <Form onSubmit={onSubmit}>
        <Form.Group widths="equal" className={styles.searchFormGroup}>
          <Form.Field
            data-cy="search-field"
            icon="search"
            fluid
            control={Input}
            placeholder="Search for projects"
            name="query"
            value={form.query ?? ''}
            onChange={onChange}
            error={form.query !== '' && formatErrorPrompt('query')}
          />
        </Form.Group>
      </Form>
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
