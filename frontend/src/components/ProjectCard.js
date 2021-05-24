import React from 'react'
import { string, object } from 'prop-types'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'

import useThumbnail from '@hooks/useThumbnail'
import styles from './ProjectCard.module.scss'

const ProjectCard = ({ name, full_name, description, owner }) => {
  const { src, isLoading, isError } = useThumbnail(full_name)
  return (
    <Link href={full_name}>
      <Card className={styles.card}>
        <div className={styles.thumbnail}>
          <div>{isLoading || isError ? null : <img src={src} />}</div>
        </div>
        <Card.Content>
          <Card.Header>{name}</Card.Header>
          <Card.Meta>{owner.username}</Card.Meta>
          <Card.Description>{description}</Card.Description>
        </Card.Content>
      </Card>
    </Link>
  )
}

ProjectCard.propTypes = {
  name: string,
  full_name: string,
  description: string,
  owner: object,
}

export default ProjectCard
