import React, { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

import { meiliIndex } from '@utils/meili'
import { Filter } from 'meilisearch'
import ProjectCard, { IntersectionObserverRef } from '../ProjectCard'
import styles from './index.module.scss'

export const cardsPerRow = 3
const defaultLimit = cardsPerRow * 6

export interface Project {
  id: string
  ownerName: string
  projectName: string
  repoName: string
  summary: string
}

interface ProjectCardGridProps {
  projects: Project[]
  intersectionObserverRef?: IntersectionObserverRef
}

const ProjectCardGrid = ({
  projects,
  intersectionObserverRef,
}: ProjectCardGridProps) => {
  return (
    <div className={styles.cardsGrid} data-cy="cards-grid">
      {projects?.map((project, index) => (
        <ProjectCard
          {...project}
          key={project.id}
          intersectionObserverRef={
            index === projects.length - cardsPerRow * 2
              ? intersectionObserverRef
              : null
          }
        />
      ))}
    </div>
  )
}

export const getKey =
  ({ query, filter }: { query: string; filter?: Filter }) =>
  (pageIndex: number, previousPageData: Project[]) => {
    if (previousPageData && !previousPageData.length) {
      // reached the end
      return null
    }
    return { query, offset: pageIndex * defaultLimit, limit: defaultLimit, filter }
  }

export interface GridFetcherArgs {
  filter?: Filter
  limit?: number
  offset?: number
  query?: string
}

export const gridFetcher = async ({
  filter,
  offset = 0,
  query = '*',
  limit = defaultLimit,
}: GridFetcherArgs) => {
  const searchResult = await meiliIndex.search(query, { limit, offset, filter })
  return searchResult.hits as Project[]
}

type SetSWRInfiniteSize = (
  size: (_size: number) => number,
) => Promise<Project[][] | undefined>

/**
 * Update useSWRInfinite size when the user reaches two rows from the end of the grid.
 * @param  setSize - the function returned by useSWRInfinite.
 */
export const useUpdateBeforeReachingLimit = (setSize: SetSWRInfiniteSize) => {
  const [ref, isReachingLimit] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (isReachingLimit) {
      setSize(size => size + 1)
    }
  }, [isReachingLimit, setSize])

  return ref
}

export default ProjectCardGrid
