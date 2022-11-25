import React from 'react'
import { SWRConfig } from 'swr'
import useSWRInfinite, { unstable_serialize } from 'swr/infinite'

import Page from '@components/Page'
import CardsGrid, {
  getKey,
  gridFetcher,
  Project,
  useUpdateBeforeReachingLimit,
} from '@components/CardsGrid'
import { userExists } from '@utils/giteaApi'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const username = params.user as string
  const exists = await userExists(username)
  if (!exists) {
    return {
      notFound: true,
    }
  }

  const searchParams = {
    query: '*',
    filter: `ownerName = ${username}`,
  }

  const hits = await gridFetcher(searchParams)

  return {
    props: {
      swrFallback: {
        [unstable_serialize(getKey(searchParams))]: hits,
      },
      username,
    },
  }
}

interface UserPageProps {
  username: string
  swrFallback: Record<string, Project[]>
}

const UserPage = ({ swrFallback, username }: UserPageProps) => {
  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <UserProjects username={username} />
    </SWRConfig>
  )
}

const UserProjects = ({ username }: Partial<UserPageProps>) => {
  const { data, setSize } = useSWRInfinite(
    getKey({ query: '*', filter: `ownerName = ${username}` }),
    gridFetcher,
  )
  const intersectionObserverRef = useUpdateBeforeReachingLimit(setSize)

  const userProjects = data?.flat()

  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <CardsGrid
        intersectionObserverRef={intersectionObserverRef}
        projects={userProjects}
      />
    </Page>
  )
}

export default UserPage
