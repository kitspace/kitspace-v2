import React from 'react'
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
  // Set the marker to load more projects to 6 cards before the end of the grid.
  const loadMoreProjectsMarker = projects.length - 6
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
