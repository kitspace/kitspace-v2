import React, { useContext, useEffect, useState } from 'react'
import { string, array } from 'prop-types'

import { Input, Form } from 'semantic-ui-react'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos, searchRepos } from '@utils/giteaApi'
import { useSearchRepos } from '@hooks/Gitea'
import SearchFromModel from '@models/SearchFrom'
import ProjectCard from '@components/ProjectCard'
import { useRouter } from 'next/router'

export const getServerSideProps = async ({ query }) => {
  const { q } = query
  if (q) {
    return {
      props: {
        repos: await searchRepos(q),
        q,
      },
    }
  }
  return {
    props: {
      repos: await getAllRepos(),
    },
  }
}

const Search = ({ repos, q }) => {
  const { user } = useContext(AuthContext)
  const { push } = useRouter()
  const username = user?.login || 'unknown user'

  const { form, onChange, isValid, formatErrorPrompt } = useForm(SearchFromModel)
  const [query, setQuery] = useState(q || '')
  const { repos: projects } = useSearchRepos(query, { initialData: repos })

  useEffect(() => {
    setQuery(isValid ? form.query : '')
  }, [form])

  useEffect(() => {
    if (query) {
      push(`/search?q=${query}`)
    } else {
      push(`/search`)
    }
  }, [query])

  return (
    <Page title="home">
      <div>Hi there {username}</div>
      <div
        style={{
          maxWidth: '500px',
          margin: 'auto',
          padding: '1rem',
          paddingBottom: '3rem',
        }}
      >
        <Form size="big">
          <Form.Field
            icon="search"
            fluid
            control={Input}
            placeholder="Search for projects"
            name="query"
            value={form.query || ''}
            onChange={onChange}
            error={form.query !== '' && formatErrorPrompt('query')}
          />
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
  repos: array.isRequired,
  q: string.isRequired,
}

export default Search
