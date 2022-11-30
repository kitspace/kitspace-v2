import React from 'react'
import { cardsPerRow } from '@hooks/useLazySearch'
import Project from '@models/Project'
import ProjectCard, { IntersectionObserverRef } from '../ProjectCard'
import styles from './index.module.scss'

interface ProjectCardGridProps {
  projects: Array<Project>
  intersectionObserverRef?: IntersectionObserverRef
}

const ProjectCardGrid = ({
  projects,
  intersectionObserverRef,
}: ProjectCardGridProps) => {
  const loadMoreProjectsMarker = projects.length - cardsPerRow * 2
  return (
    <div className={styles.cardsGrid} data-cy="cards-grid">
      {projects?.map((project, index) => (
        <ProjectCard
          {...project}
          key={project.id}
          intersectionObserverRef={
            index === loadMoreProjectsMarker ? intersectionObserverRef : null
          }
        />
      ))}
    </div>
  )
}

export default ProjectCardGrid
