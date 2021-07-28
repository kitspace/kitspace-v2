import React, { useContext, useEffect } from 'react'
import { array } from 'prop-types'

import { Input, Form } from 'semantic-ui-react'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
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
      },
    }
  }
  return {
    props: {
      projects: await getFlatProjects(await getAllRepos()),
    },
  }
}

const Search = ({ projects }) => {
  const { user } = useContext(AuthContext)
  const { push } = useRouter()
  const username = user?.login || 'unknown user'

  const { form, onChange, isValid, formatErrorPrompt } = useForm(SearchFormModel)

  const handleSubmit = () => {
    push(`/search?q=${form.query}`)
  }

  useEffect(() => {
    /* eslint-disable react-hooks/exhaustive-deps */
    /*
        ! The ignored dependency is `push` which isn't actually a dependency for this usecase; it won't change.
        ! Adding `push` to the deps array will cause infinite fetching;
        ! on first page mount the value of `push` changes which triggers the hook.
        ! The hook will call `push` and and a new page(the json from next SSR) will load resulting in infinite fetching.
      */
    // If search query got cleared
    if (form.query === '') push('/search')
  }, [form])

  return (
    <Page title="home">
      <div>Hi there {username}</div>
      <div
        style={{
          maxWidth: '600px',
          margin: 'auto',
          padding: '1rem',
          paddingBottom: '3rem',
        }}
      >
        <Form onSubmit={handleSubmit}>
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
      <div>
        {projects?.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

Search.propTypes = {
  projects: array.isRequired,
}

export default Search
