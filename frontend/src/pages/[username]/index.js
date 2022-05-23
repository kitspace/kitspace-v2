import React, { useContext } from 'react'
import { isEmpty } from 'lodash'
import { object, string } from 'prop-types'
import { MeiliSearch } from 'meilisearch'
import useSWR, { SWRConfig } from 'swr'

import { AuthContext } from '@contexts/AuthContext'
import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { getUserRepos, userExists } from '@utils/giteaApi'
import styles from './username.module.scss'

const fetcher = async (username, meiliApiKey) => {
  const meili = new MeiliSearch({
    host: process.env.KITSPACE_MEILISEARCH_URL,
    apiKey: meiliApiKey,
  })
  const index = meili.index('projects')
  const searchResult = await index.search('*', {
    filter: `ownerName = ${username}`,
  })
  return searchResult.hits
}

export const getServerSideProps = async ({ params, req }) => {
  const userRepos = await getUserRepos(params.username)

  if (isEmpty(userRepos) && !(await userExists(params.username))) {
    return {
      notFound: true,
    }
  }

  const hits = await fetcher(params.username, req.session.meiliApiKey)

  return {
    props: {
      swrFallback: {
        [params.username]: hits,
      },
      username: params.username,
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
  const { meiliApiKey } = useContext(AuthContext)
  const { data: userProjects } = useSWR(username, username =>
    fetcher(username, meiliApiKey),
  )
  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <div className={styles}>
        {userProjects?.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

User.propTypes = {
  username: string.isRequired,
}

export default UserPage
