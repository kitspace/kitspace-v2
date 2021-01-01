import React, { useContext, useState, useEffect } from 'react'
import { Card, Image, Placeholder } from 'semantic-ui-react'
import useSWR from 'swr'

import styles from './index.module.scss'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import { getSession, getRepos } from '@utils/giteaApi'

const processorUrl = process.env.KITSPACE_PROCESSOR_URL

const fetcher = (...args) => fetch(...args).then(r => r.json())

const useThumbnail = full_name => {
  const img = `/${full_name}/HEAD/images/top.png`
  const statusUrl = processorUrl + '/status/' + img
  const { data, error } = useSWR(statusUrl, fetcher, { refreshInterval: 1000 })
  const isError = error || data?.status === 'failed'
  return {
    src: processorUrl + '/files/' + img,
    isLoading: !isError && data?.status !== 'done',
    isError,
  }
}

const ProjectCard = ({ name, full_name, description, owner }) => {
  const { src, isLoading, isError } = useThumbnail(full_name)
  return (
    <Card>
      <div className={styles.thumbnail}>
        <div>{isLoading || isError ? null : <img src={src} />}</div>
      </div>
      <Card.Content>
        <Card.Header>{name}</Card.Header>
        <Card.Meta>{owner.username}</Card.Meta>
        <Card.Description>{description}</Card.Description>
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
        {projects.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

export default Home
