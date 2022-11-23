import React, { useEffect } from 'react'
import { object, string } from 'prop-types'
import { SWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'

import Page from '@components/Page'
import CardsGrid, { cardsPerRow, limit } from '@components/CardsGrid'
import { useInView } from 'react-intersection-observer'
import { userExists } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'

const getKey = (query, filter) => (pageIndex, previousPageData) => {
  if (previousPageData && !previousPageData.length) {
    return null // reached the end
  }
  return { query, offset: pageIndex * limit, limit, filter }
}

const fetchUserProjects = async ({ query, offset, limit, filter }) => {
  const searchResult = await meiliIndex.search(query, {
    offset,
    limit,
    filter,
  })
  return searchResult.hits
}

export const getServerSideProps = async ({ params }) => {
  const username = params.user
  const exists = await userExists(username)
  if (!exists) {
    return {
      notFound: true,
    }
  }

  const q = {
    query: '*',
    filter: `ownerName = ${username}`,
    limit,
    offset: 0,
  }

  const hits = await fetchUserProjects(q)

  return {
    props: {
      swrFallback: {
        [q]: hits,
      },
      username,
    },
  }
}

const UserPage = ({ swrFallback, username }) => {
  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <User username={username} />
    </SWRConfig>
  )
}

UserPage.propTypes = {
  swrFallback: object,
  username: string.isRequired,
}

const User = ({ username }) => {
  const { data, setSize } = useSWRInfinite(
    getKey('*', `ownerName = ${username}`),
    fetchUserProjects,
  )

  const userProjects = data?.flat()
  const [ref, isReachingLimit] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (isReachingLimit) {
      setSize(size => size + 1)
    }
  }, [isReachingLimit, setSize])

  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <CardsGrid
        cardsPerRow={cardsPerRow}
        intersectionObserverRef={ref}
        projects={userProjects}
      />
    </Page>
  )
}

User.propTypes = {
  username: string.isRequired,
}

export default UserPage
