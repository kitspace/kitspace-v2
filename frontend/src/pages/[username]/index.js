import React from 'react'
import { isEmpty } from 'lodash'
import { arrayOf, object, string } from 'prop-types'

import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { getUserRepos, userExists } from '@utils/giteaApi'
import { useUserProjects } from '@hooks/Gitea'
import styles from './username.module.scss'

export const getServerSideProps = async ({ params, req }) => {
  const userRepos = await getUserRepos(params.username)

  if (isEmpty(userRepos) && !(await userExists(params.username))) {
    return {
      notFound: true,
    }
  }

  const searchResult = await req.meiliIndex.search('', {
    filter: `ownerName = ${params.username}`,
  })

  return {
    props: {
      userProjects: searchResult.hits,
      username: params.username,
    },
  }
}

const User = ({ userProjects, username }) => {
  const { repos: projects } = useUserProjects(username, {
    initialData: userProjects,
  })

  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <div className={styles}>
        {projects?.map((project, i) => (
          <ProjectCard {...project} key={i} />
        ))}
      </div>
    </Page>
  )
}

User.propTypes = {
  userProjects: arrayOf(object),
  username: string.isRequired,
}

export default User
