import React from 'react'
import PropTypes from 'prop-types'

import ProjectCard from '../ProjectCard'
import styles from './index.module.scss'

export const cardsPerRow = 3
export const limit = cardsPerRow * 6

const CardsGrid = ({ projects, intersectionObserverRef }) => {
  return (
    <div className={styles.cardsGrid} data-cy="cards-grid">
      {projects?.map((project, index) => (
        <ProjectCard
          {...project}
          key={project.id}
          ref={
            index === projects.length - cardsPerRow * 2
              ? intersectionObserverRef
              : null
          }
        />
      ))}
    </div>
  )
}

CardsGrid.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object),
  intersectionObserverRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(PropTypes.elementType) }),
  ]),
}

export default CardsGrid
