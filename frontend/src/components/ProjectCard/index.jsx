import React from 'react'
import { string } from 'prop-types'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'

import useThumbnail from '@hooks/useThumbnail'
import styles from './index.module.scss'

const ProjectCard = ({ name, summary, ownerName, multiParentName }) => {
  const isSingleProject = name === '_'
  const nameOnCard = isSingleProject ? multiParentName : name
  const repoName = multiParentName
  const { src, isLoading, isError } = useThumbnail(`${ownerName}/${repoName}`, name)
  return (
    <Link
      passHref
      href={`/${ownerName}/${repoName}${isSingleProject ? '' : '/' + name}`}
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
          <Card.Header className={styles.cardText} data-cy="project-card-name">
            {nameOnCard}
          </Card.Header>
          <Card.Meta className={styles.cardText}>{ownerName}</Card.Meta>
          <Card.Description className={styles.cardDescription}>
            {summary}
          </Card.Description>
        </Card.Content>
      </Card>
    </Link>
  )
}

ProjectCard.propTypes = {
  name: string.isRequired,
  summary: string.isRequired,
  ownerName: string.isRequired,
  multiParentName: string,
}

ProjectCard.defaultProps = {
  multiParentName: null,
}

export default ProjectCard
