import React, { useContext, useEffect } from 'react'
import { arrayOf, object, string } from 'prop-types'

import { Input, Form } from 'semantic-ui-react'

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

  const { repos: projects, mutate } = useSearchRepos(query, {
    initialData: initialProjects,
    revalidateOnMount: false,
    revalidateOnFocus: false,
  })

  useEffect(() => {
    mutate()
  }, [query, mutate])

  return (
    <div>
      {projects?.map(project => (
        <ProjectCard {...project} key={project.id} />
      ))}
    </div>
  )
}

const SearchForm = () => {
  const { form, onChange, isValid, formatErrorPrompt, populate } =
    useForm(SearchFormModel)
  const { push, asPath } = useRouter()
  const { updateQuery, query } = useSearchQuery()

  useEffect(() => {
    populate({ query })
  }, [populate, query])

  const handleSearchFormSubmit = () => {
    // The homepage `/` redirects to this page - a soft redirect.
    const isHomepage = asPath === '/'

    if (isHomepage) {
      // redirect to `/search` page when the form is submitted from homepage.
      push(`/search?q=${form.query}`)
    } else {
      // If the form is submitted from `/search` page, shallow redirect and delegate updating page content to swr.
      push(`/search?q=${form.query}`, undefined, { shallow: true })
      updateQuery(form.query)
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
            value={form.query ?? ''}
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
  initialQuery: string,
}

CardsGrid.propTypes = {
  initialProjects: arrayOf(object).isRequired,
}

export default Search
