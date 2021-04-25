import React from 'react'
import { isEmpty } from 'lodash'

import { Page } from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { getUserRepos, userExists } from '@utils/giteaApi'
import styles from './username.module.scss'
import { useUserRepos } from '@hooks/Gitea'

export const getServerSideProps = async ({ params }) => {
  console.log(params)
  const userRepos = await getUserRepos(params.username)

  if (isEmpty(userRepos) && !(await userExists(params.username))) {
    return {
      notFound: true,
    }
  } else {
    return {
      props: {
        userRepos,
        username: params.username,
      },
    }
  }
}

const User = ({ userRepos, username }) => {
  const { repos: projects } = useUserRepos(username, { initialData: userRepos })

  return (
    <Page title={username}>
      <h1>Projects by {username}</h1>
      <div className={styles}>
        {projects?.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

export default User
