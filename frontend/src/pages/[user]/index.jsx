import React from 'react'
import { object, string } from 'prop-types'
import { SWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'

import Page from '@components/Page'
import CardsGrid, {
  cardsPerRow,
  getKey,
  gridFetcher,
  useUpdateBeforeReachingLimit,
} from '@components/CardsGrid'
import { userExists } from '@utils/giteaApi'

export const getServerSideProps = async ({ params }) => {
  const username = params.user
  const exists = await userExists(username)
  if (!exists) {
    return {
      notFound: true,
    }
  }

  const q = {
    filter: `ownerName = ${username}`,
  }

  const hits = await gridFetcher(q)

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
    gridFetcher,
  )
  const intersectionObserverRef = useUpdateBeforeReachingLimit(setSize)

  const userProjects = data?.flat()

  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <CardsGrid
        cardsPerRow={cardsPerRow}
        intersectionObserverRef={intersectionObserverRef}
        projects={userProjects}
      />
    </Page>
  )
}

User.propTypes = {
  username: string.isRequired,
}

export default UserPage
