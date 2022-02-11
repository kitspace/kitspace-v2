import React from 'react'
import { string, object, bool } from 'prop-types'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'

import useThumbnail from '@hooks/useThumbnail'
import styles from './index.module.scss'

const ProjectCard = ({
  name,
  full_name: fullname,
  description,
  owner,
  isMultiProject,
}) => {
  const { src, isLoading, isError } = useThumbnail(
    fullname,
    isMultiProject ? name : null,
  )
  return (
    <Link passHref href={`/${fullname}/${isMultiProject ? name : ''}`}>
      <Card as="a" className={styles.card} data-cy="project-card">
        <div className={styles.thumbnail}>
          <div>
            {isLoading || isError ? null : (
              <Image
                alt={`${name} by ${owner.username}`}
                data-cy="project-card-thumbnail"
                height={180}
                objectFit="contain"
                src={src}
                width={240}
              />
            )}
          </div>
        </div>
        <Card.Content>
          <Card.Header data-cy="project-card-name">{name}</Card.Header>
          <Card.Meta>{owner.username}</Card.Meta>
          <Card.Description>{description}</Card.Description>
        </Card.Content>
      </Card>
    </Link>
  )
}

ProjectCard.propTypes = {
  name: string.isRequired,
  full_name: string.isRequired,
  description: string.isRequired,
  owner: object.isRequired,
  isMultiProject: bool,
}

ProjectCard.defaultProps = {
  isMultiProject: false,
}

export default ProjectCard
