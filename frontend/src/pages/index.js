import React, { useContext } from 'react'

import { Page } from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos } from '@utils/giteaApi'
import { useAllRepos } from '@hooks/Gitea'

export const getStaticProps = async () => {
  const repos = await getAllRepos()

  return {
    props: {
      repos,
    },
    // Regenerate the static version each hour.
    // Even If there was an update `useAllRepos` will grab the latest update on mount.
    revalidate: Number(process.env.INDEX_ISR_INTERVAL) || 3600,
  }
}

const Home = ({ repos }) => {
  const { user } = useContext(AuthContext)
  const username = user?.login || 'unknown user'

  const { repos: projects } = useAllRepos({ initialData: repos })

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
