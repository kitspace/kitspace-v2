import React from 'react'
import { isEmpty, flatten } from 'lodash'
import { arrayOf, object, string } from 'prop-types'

import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { getUserRepos, userExists } from '@utils/giteaApi'
import styles from './username.module.scss'

const isMultiProject = async fullname => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const res = await fetch(
    `${processorUrl}/files/${fullname}/HEAD/kitspace-yaml.json`,
  )

  if (!res.ok) return false

  const kitspaceYAML = await res.json()
  return kitspaceYAML.hasOwnProperty('multi')
}

const subProjects = async project => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  const res = await fetch(
    `${processorUrl}/files/${project.full_name}/HEAD/kitspace-yaml.json`,
  )
  const { multi } = await res.json()

  return Object.keys(multi).map(projectName => {
    return {
      name: projectName,
      full_name: project.full_name,
      description: multi[projectName].summary,
      owner: project.owner,
      isSubProject: true,
    }
  })
}

export const getServerSideProps = async ({ params }) => {
  const userRepos = await getUserRepos(params.username)

  const flattenedUserRepos = flatten(
    await Promise.all(
      userRepos.map(async repo => {
        const isMulti = await isMultiProject(repo.full_name)
        if (!isMulti) {
          return repo
        } else {
          return await subProjects(repo)
        }
      }),
    ),
  )

  if (isEmpty(userRepos) && !(await userExists(params.username))) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      userRepos: flattenedUserRepos,
      username: params.username,
    },
  }
}

const User = ({ userRepos, username }) => {
  const projects = userRepos
  // const { repos: projects } = useUserRepos(username, { initialData: userRepos })

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

User.propTypes = {
  userRepos: arrayOf(object).isRequired,
  username: string.isRequired,
}

export default User
