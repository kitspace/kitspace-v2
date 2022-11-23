import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useInView } from 'react-intersection-observer'

import { meiliIndex } from '@utils/meili'
import ProjectCard from '../ProjectCard'
import styles from './index.module.scss'

export const cardsPerRow = 3
const LIMIT = cardsPerRow * 6

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

export const getKey = (query, filter) => (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.length) {
    // reached the end
    return null
  }
  return { query, offset: pageIndex * LIMIT, limit: LIMIT, filter }
}

export const gridFetcher = async ({
  filter,
  offset = 0,
  query = '*',
  limit = LIMIT,
}) => {
  const searchResult = await meiliIndex.search(query, { limit, offset, filter })
  return searchResult.hits
}

/**
 * Update useSWRInfinite size when the user reaches two rows from the end of the grid.
 * @param {function} setSize - the function returned by useSWRInfinite.
 */
export const useUpdateBeforeReachingLimit = setSize => {
  const [ref, isReachingLimit] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (isReachingLimit) {
      setSize(size => size + 1)
    }
  }, [isReachingLimit, setSize])

  return ref
}

export default CardsGrid
