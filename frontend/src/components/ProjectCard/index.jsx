import React, { forwardRef } from 'react'
import { string } from 'prop-types'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'

import useThumbnail from '@hooks/useThumbnail'
import styles from './index.module.scss'

const ProjectCard = forwardRef(
  ({ projectName, summary, ownerName, repoName }, ref) => {
    const isSingleProject = projectName === '_'
    const nameOnCard = isSingleProject ? repoName : projectName
    const { src, isLoading, isError } = useThumbnail(
      `${ownerName}/${repoName}`,
      projectName,
    )
    return (
      <Link
        passHref
        href={`/${ownerName}/${repoName}${
          isSingleProject ? '' : '/' + projectName
        }`}
      >
        <Card as="a" className={styles.card} data-cy="project-card">
          <div ref={ref} className={styles.thumbnail}>
            <div>
              {isLoading || isError ? null : (
                <Image
                  alt={`Render of PCB of ${nameOnCard}`}
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
  },
)

ProjectCard.displayName = 'ProjectCard'

ProjectCard.propTypes = {
  projectName: string.isRequired,
  summary: string.isRequired,
  ownerName: string.isRequired,
  repoName: string,
}

export default ProjectCard
