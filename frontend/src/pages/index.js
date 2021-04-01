import React, { useContext, useEffect, useState } from 'react'

import { Input, Form } from 'semantic-ui-react'

import { Page } from '@components/Page'
import useForm from '@hooks/useForm'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos, searchRepos } from '@utils/giteaApi'
import { SearchFromModel } from '@models/SearchFrom'
import ProjectCard from '@components/ProjectCard'
import { useRouter } from 'next/router'

export const getServerSideProps = async ({ query }) => {
  const { q } = query
  if (q) {
    return {
      props: {
        projects: await searchRepos(q),
        q,
      },
    }
  } else {
    return {
      props: {
        projects: await getAllRepos(),
      },
    }
  }
}

const Home = ({ projects, q }) => {
  const { user } = useContext(AuthContext)
  const { push } = useRouter()
  const username = user?.login || 'unknown user'

  const { form, onChange, formatErrorPrompt, populate } = useForm(SearchFromModel)
  const [query, setQuery] = useState(q || form.query)

  // if the page loads with a query, e.g., a user visit `/?q=random`,
  // populate the search field with that query(`random`)
  useEffect(() => {
    populate({ query })
  }, [])

  useEffect(() => {
    setQuery(form.query)
  }, [form])

  useEffect(() => {
    query ? push(`/?q=${query}`) : push(`/`)
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

export default Home
