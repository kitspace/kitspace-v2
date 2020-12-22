import React, { useContext, useState, useEffect } from 'react'
import { Card, Image, Placeholder } from 'semantic-ui-react'
import useSWR from 'swr'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import { getSession, getRepos } from '@utils/giteaApi'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useThumbnail = name => {
  const img = `/${name}/HEAD/images/top.png`
  const statusUrl = processorUrl + '/status/' + img
  const { data, error } = useSWR(statusUrl, fetcher, { refreshInterval: 1000 })
  const isError = error || data?.status === 'failed'
  return {
    src: processorUrl + '/files/' + img,
    isLoading: !isError && data?.status !== 'done',
    isError,
  }
}

const ProjectCard = ({ name }) => {
  const { src, isLoading, isError } = useThumbnail(name)
  return (
    <Card>
      {isLoading || isError ? (
        <div style={{ width: 200, height: 200, background: 'lightgrey' }} />
      ) : (
        <Image src={src} />
      )}
      <Card.Content>
        <Card.Header>{name}</Card.Header>
      </Card.Content>
    </Card>
  )
}

const Home = ({ repos }) => {
  const { user, csrf } = useContext(AuthContext)
  const username = user?.login || 'unknown user'
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (csrf) {
      getRepos(csrf).then(setProjects)
    }
  }, [csrf])

  return (
    <Page title="home">
      <div>Hi there {username}</div>
      <div>
        {projects.map(({ full_name }) => (
          <ProjectCard name={full_name} key={full_name} />
        ))}
      </div>
    </Page>
  )
}

export default Home
