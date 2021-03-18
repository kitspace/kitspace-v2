import React, { useContext } from 'react'

import { Page } from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import { AuthContext } from '@contexts/AuthContext'
import { getAllRepos } from '@utils/giteaApi'
import { useAllRepos } from '@hooks/Gitea'

export const getServerSideProps = async () => {
    const repos = await getAllRepos()

    return {
        props: {
            repos,
        },
    }
}

const Search = ({ repos }) => {
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

export default Search
