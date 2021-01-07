import React, { useContext } from 'react'
import useSWR from 'swr'

import { Page } from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos, useAllRepos } from '@utils/giteaApi'

export const getStaticProps = async () => {
  const repos = await getAllRepos()

  return {
    props: {
      repos,
    },
  }
}

const Home = ({ repos }) => {
  const { user } = useContext(AuthContext)
  const username = user?.login || 'unknown user'

  const { repos: projects } = useAllRepos(repos)

  return (
    <Page title="home">
      <div>Hi there {username}</div>
      <div>
        {projects?.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

export default Home
