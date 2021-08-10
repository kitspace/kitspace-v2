import React, { useCallback, useContext, useEffect, useState } from 'react'
import { arrayOf, func, object, string } from 'prop-types'

import { Input, Form, Loader } from 'semantic-ui-react'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
import { useSearchRepos } from '@hooks/Gitea'
import { AuthContext } from '@contexts/AuthContext'
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
        q,
      },
    }
  }
  return {
    props: {
      initialProjects: await getFlatProjects(await getAllRepos()),
    },
  }
}

const Search = ({ initialProjects, q }) => {
  const { query } = useRouter()
  const { user } = useContext(AuthContext)

  const username = user?.login || 'unknown user'
  const [swrQuery, setSwrQuery] = useState(q)

  const {
    repos: projects,
    mutate,
    isLoading,
  } = useSearchRepos(swrQuery, {
    initialData: initialProjects,
    revalidateOnMount: false,
    revalidateOnFocus: false,
  })

  const afterSubmit = useCallback(() => {
    // mutate after ms to make sure the `path` has been updated
    setTimeout(() => {
      mutate()
    }, 50)
  }, [mutate])

  useEffect(() => {
    setSwrQuery(query.q)
  }, [query.q])

  if (isLoading) {
    return (
      <Page>
        <Loader style={{ margin: 'auto' }} active>
          Searching...
        </Loader>
      </Page>
    )
  }

  return (
    <Page title="Kitspace | Home">
      <div>Hi there {username}</div>
      <SearchForm afterSubmit={afterSubmit} initialQuery={q} />
      <CardsGrid projects={projects} />
    </Page>
  )
}

const CardsGrid = ({ projects }) => {
  return (
    <div>
      {projects?.map(project => (
        <ProjectCard {...project} key={project.id} />
      ))}
    </div>
  )
}

const SearchForm = ({ afterSubmit, initialQuery }) => {
  const { form, onChange, isValid, formatErrorPrompt } = useForm(SearchFormModel)
  const { push, asPath } = useRouter()

  const onClear = () => {
    push('/search', undefined, { shallow: true })
    afterSubmit()
  }

  const handleSearchFormSubmit = () => {
    // The homepage `/` redirects to this page - a soft redirect.
    const isHomepage = asPath === '/'

    if (isHomepage) {
      // redirect to `/search` page when the form is submitted from homepage.
      push(`/search?q=${form.query}`)
    } else {
      // If the form is submitted from `/search` page, shallow redirect and delegate updating page content to swr.
      push(`/search?q=${form.query}`, undefined, { shallow: true })
      afterSubmit()
    }
  }

  useEffect(() => {
    /* eslint-disable react-hooks/exhaustive-deps */
    /*
      ! The ignored dependency is `push` which isn't actually a dependency for this usecase; it won't change.
      ! Adding `push` to the deps array will cause infinite fetching;
      ! on first page mount the value of `push` changes which triggers the hook.
      ! The hook will call `push` and and a new page(the json from next SSR) will load resulting in infinite fetching.
    */
    if (form.query === '') onClear()
  }, [form.query])

  return (
    <div
      style={{
        maxWidth: '600px',
        margin: 'auto',
        padding: '1rem',
        paddingBottom: '3rem',
      }}
    >
      <Form onSubmit={handleSearchFormSubmit}>
        <Form.Group widths="equal" className={styles.searchForm}>
          <Form.Field
            data-cy="search-field"
            icon="search"
            fluid
            control={Input}
            placeholder="Search for projects"
            name="query"
            value={form.query || initialQuery}
            onChange={onChange}
            error={form.query !== '' && formatErrorPrompt('query')}
          />
          <Form.Button
            data-cy="search-button"
            className={styles.searchButton}
            content="search"
            disabled={!isValid}
          />
        </Form.Group>
      </Form>
    </div>
  )
}

Search.propTypes = {
  initialProjects: arrayOf(object).isRequired,
  q: string,
}

CardsGrid.propTypes = {
  projects: arrayOf(object).isRequired,
}

SearchForm.propTypes = {
  afterSubmit: func.isRequired,
  initialQuery: string,
}

export default Search
