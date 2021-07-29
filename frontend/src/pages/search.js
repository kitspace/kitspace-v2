import React, { useContext, useEffect, useState } from 'react'
import { array } from 'prop-types'

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
        projects: await getFlatProjects(await searchRepos(q)),
        q,
      },
    }
  }
  return {
    props: {
      projects: await getFlatProjects(await getAllRepos()),
    },
  }
}

const Search = ({ projects: initialProjects, q }) => {
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
  })

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
      <SearchForm setSwrQuery={setSwrQuery} mutate={mutate} />
      <div>
        {projects?.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

const SearchForm = ({ mutate }) => {
  const { form, onChange, isValid, formatErrorPrompt } = useForm(SearchFormModel)
  const { push, asPath } = useRouter()

  const handleSearchFormSubmit = () => {
    // The homepage `/` redirects to this page - a soft redirect.
    const isHomepage = asPath === '/'

    if (isHomepage) {
      // redirect to `/search` page when the form is submitted.
      push(`/search?q=${form.query}`)
    } else {
      // If the form is submitted from `/search` page, shallow redirect and delegate updating page content to swr.
      push(`/search?q=${form.query}`, undefined, { shallow: true })
      setTimeout(() => {
        // Delay mutation to make sure the `path` has been updated
        mutate()
      }, 50)
    }
  }

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
            value={form.query || ''}
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
  projects: array.isRequired,
}

export default Search
