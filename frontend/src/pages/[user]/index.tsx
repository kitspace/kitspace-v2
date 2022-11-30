import React from 'react'
import { GetServerSideProps } from 'next'
import { SWRConfig } from 'swr'
import { unstable_serialize } from 'swr/infinite'

import Page from '@components/Page'
import ProjectCardGrid from '@components/ProjectCardGrid'
import {
  makeSWRKeyGetter,
  searchFetcher,
  useLazySearch,
} from '@hooks/useLazySearch'
import { userExists } from '@utils/giteaApi'
import Project from '@models/Project'

interface UserPageProps {
  username: string
  swrFallback: Record<string, Array<Array<Project>>>
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const username = params.user as string
  const exists = await userExists(username)
  if (!exists) {
    return {
      notFound: true,
    }
  }

  const searchParams = {
    query: '',
    filter: `ownerName = ${username}`,
  }

  const hits = await searchFetcher(searchParams)
  const props: UserPageProps = {
    swrFallback: {
      // unstable_serialize is clever enough to turn our key getter function into the right string key
      [unstable_serialize(makeSWRKeyGetter(searchParams))]: [hits],
    },
    username,
  }

  return {
    props,
  }
}

const UserPage = ({ swrFallback, username }: UserPageProps) => {
  return (
    <SWRConfig value={{ fallback: swrFallback }}>
      <UserProjects username={username} />
    </SWRConfig>
  )
}

const UserProjects = ({ username }: Partial<UserPageProps>) => {
  const { intersectionObserverRef, projects } = useLazySearch({
    query: '',
    filter: `ownerName = ${username}`,
  })
  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <ProjectCardGrid
        intersectionObserverRef={intersectionObserverRef}
        projects={projects}
      />
    </Page>
  )
}

export default UserPage
