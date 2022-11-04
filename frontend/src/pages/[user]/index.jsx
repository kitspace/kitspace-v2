import React from 'react'
import { object, string } from 'prop-types'
import useSWR, { SWRConfig } from 'swr'

import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { userExists } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'
import styles from './username.module.scss'

const fetchUserProjects = async username => {
  const searchResult = await meiliIndex.search('*', {
    filter: `ownerName = ${username}`,
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

  const hits = await fetchUserProjects(username)

  return {
    props: {
      swrFallback: {
        [params.username]: hits,
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
  const { data: userProjects } = useSWR(username, fetchUserProjects)
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
