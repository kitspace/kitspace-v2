import React from 'react'
import { string, object } from 'prop-types'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'

import useThumbnail from '@hooks/useThumbnail'
import styles from './index.module.scss'

const ProjectCard = ({ name, summary, ownerName, multiParentName }) => {
  const isMultiProject = multiParentName != null
  const repoName = isMultiProject ? multiParentName : name
  const { src, isLoading, isError } = useThumbnail(
    `${ownerName}/${repoName}`,
    multiParentName ? name : null,
  )
  return (
    <Link
      passHref
      href={`/${ownerName}/${repoName}${isMultiProject ? '/' + name : ''}`}
    >
      <Card as="a" className={styles.card} data-cy="project-card">
        <div className={styles.thumbnail}>
          <div>
            {isLoading || isError ? null : (
              <Image
                alt={`${name} by ${ownerName}`}
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
          <Card.Meta>{ownerName}</Card.Meta>
          <Card.Description>{summary}</Card.Description>
        </Card.Content>
      </Card>
    </Link>
  )
}

ProjectCard.propTypes = {
  name: string.isRequired,
  summary: string.isRequired,
  ownerName: object.isRequired,
  multiParentName: string,
}

ProjectCard.defaultProps = {
  multiParentName: null,
}

export default ProjectCard
