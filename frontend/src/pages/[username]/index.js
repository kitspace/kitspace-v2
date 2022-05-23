import React, { useContext } from 'react'
import { object, string } from 'prop-types'
import useSWR, { SWRConfig } from 'swr'

import { AuthContext } from '@contexts/AuthContext'
import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { userExists } from '@utils/giteaApi'
import * as meili from '@utils/meili'
import styles from './username.module.scss'

const fetcher = async (username, meiliApiKey) => {
  const searchResult = await meili.search('*', {
    meiliApiKey,
    filter: `ownerName = ${username}`,
  })
  return searchResult.hits
}

export const getServerSideProps = async ({ params, req }) => {
  const exists = await userExists(params.username)
  if (!exists) {
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
      <div className={styles.projectsList}>
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
