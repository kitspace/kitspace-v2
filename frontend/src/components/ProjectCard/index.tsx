import React from 'react'
import { Card } from 'semantic-ui-react'
import Link from 'next/link'

import useThumbnail from '@hooks/useThumbnail'
import styles from './index.module.scss'

export type IntersectionObserverRef = (node?: Element) => void
interface ProjectCardProps {
  projectName: string
  summary: string
  ownerName: string
  repoName: string
  intersectionObserverRef?: IntersectionObserverRef
}

const ProjectCard = ({
  projectName,
  summary,
  ownerName,
  repoName,
  intersectionObserverRef,
}: ProjectCardProps) => {
  const isSingleProject = projectName === '_'
  const nameOnCard = isSingleProject ? repoName : projectName
  const { src, isLoading, isError } = useThumbnail(
    `${ownerName}/${repoName}`,
    projectName,
  )
  return (
    <Link
      legacyBehavior
      passHref
      href={`/${ownerName}/${repoName}${isSingleProject ? '' : '/' + projectName}`}
    >
      <Card as="a" className={styles.card} data-cy="project-card">
        <div ref={intersectionObserverRef} className={styles.thumbnail}>
          {isLoading || isError ? null : (
            <img
              alt={`Render of PCB of ${nameOnCard}`}
              data-cy="project-card-thumbnail"
              src={src}
              style={{ maxWidth: 240, maxHeight: 180 }}
            />
          )}
        </div>
        <Card.Content>
          <Card.Header
            className={`${styles.cardText} ${styles.cardHeader}`}
            data-cy="project-card-name"
          >
            {nameOnCard}
          </Card.Header>
          <Card.Meta className={`${styles.cardText} ${styles.ownerName}`}>
            {ownerName}
          </Card.Meta>
          <Card.Description className={styles.cardDescription}>
            {summary}
          </Card.Description>
        </Card.Content>
      </Card>
    </Link>
  )
}

export default ProjectCard
