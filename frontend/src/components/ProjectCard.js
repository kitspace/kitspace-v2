import useSWR from 'swr'
import { Card } from 'semantic-ui-react'
import styles from './ProjectCard.module.scss'
import React from 'react'

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

export default ProjectCard
