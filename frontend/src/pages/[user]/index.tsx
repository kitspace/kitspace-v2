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
import { getUser } from '@utils/giteaApi'
import Project from '@models/Project'
import Head from '@components/Head'
import getConfig from 'next/config'

interface UserPageProps {
  username: string
  swrFallback: Record<string, Array<Array<Project>>>
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const userLowerCase = (params.user as string).toLowerCase()
  const user = await getUser(userLowerCase)
  if (!user) {
    return {
      notFound: true,
    }
  }

  const username = user.login

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

const { KITSPACE_PROCESSOR_ASSET_URL, KITSPACE_URL } =
  getConfig().publicRuntimeConfig

const UserProjects = ({ username }: Partial<UserPageProps>) => {
  const { intersectionObserverRef, projects } = useLazySearch({
    query: '',
    filter: `ownerName = ${username}`,
  })
  const ogImageProject = projects[0]
  return (
    <Page>
      <Head
        ogDescription="Shared on kitspace.org"
        ogImage={
          ogImageProject
            ? `${KITSPACE_PROCESSOR_ASSET_URL}/${username}/${ogImageProject.repoName}/HEAD/${ogImageProject.projectName}/images/top-with-background.png`
            : undefined
        }
        title={`Projects by ${username}`}
        url={`${KITSPACE_URL}/${username}`}
      />
      <h1>Projects by {username}</h1>
      <ProjectCardGrid
        intersectionObserverRef={intersectionObserverRef}
        projects={projects}
      />
    </Page>
  )
}

export default UserPage
