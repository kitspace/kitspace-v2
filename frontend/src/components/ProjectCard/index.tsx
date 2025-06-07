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
  gitHash: string
  intersectionObserverRef?: IntersectionObserverRef
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  projectName,
  summary,
  ownerName,
  repoName,
  gitHash,
  intersectionObserverRef,
}) => {
  const isSingleProject = projectName === '_'
  const nameOnCard = isSingleProject ? repoName : projectName
  const { top, topLarge, isLoading, isError } = useThumbnail(
    `${ownerName}/${repoName}`,
    projectName,
    gitHash,
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
            <picture>
              <source
                data-cy="project-card-thumbnail-large"
                media="(min-resolution: 1.5dppx)"
                srcSet={topLarge}
              />
              <img
                alt={`Render of PCB of ${nameOnCard}`}
                data-cy="project-card-thumbnail"
                src={top}
                style={{ maxWidth: 240, maxHeight: 180 }}
              />
            </picture>
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
