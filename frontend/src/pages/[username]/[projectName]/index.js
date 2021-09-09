import React from 'react'

import { canCommit, getRepo, repoExists } from '@utils/giteaApi'
import {
  getBoardBomInfo,
  getBoardGerberInfo,
  getKitspaceYAMLJson,
  hasInteractiveBom,
  getIsProcessingDone,
  getFlatProjects,
  getReadme,
} from '@utils/projectPage'
import SharedProjectPage from '@components/SharedProjectPage'
import { arrayOf, object, string } from 'prop-types'
import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'

export const getServerSideProps = async ({ params, query, req }) => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  // `repoFullname` is resolved by matching its name against the `page` dir.
  // Then it's used to access the repo by the Gitea API.
  const repoFullname = `${params.username}/${params.projectName}`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD`

  if (await repoExists(repoFullname)) {
    const [
      repo,
      readme,
      [boardBomInfoExists, boardBomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYAMLExists, kitspaceYAML],
      finishedProcessing,
      hasIBOM,
      // The repo owner and collaborators can upload files.
      hasUploadPermission,
    ] = await Promise.all([
      getRepo(repoFullname),
      getReadme(assetsPath),
      getBoardBomInfo(assetsPath),
      getBoardGerberInfo(assetsPath),
      getKitspaceYAMLJson(assetsPath),
      getIsProcessingDone(assetsPath),
      hasInteractiveBom(assetsPath),
      canCommit(repoFullname, req?.session?.user?.username),
    ])

    const isMultiProject = kitspaceYAML.hasOwnProperty('multi')

    if (isMultiProject && finishedProcessing) {
      const flattenedProjects = await getFlatProjects([repo])
      return {
        props: {
          subProjects: flattenedProjects,
          parentProject: params.projectName,
        },
      }
    }

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    return {
      props: {
        assetsPath,
        repo,
        projectFullname: repoFullname,
        hasUploadPermission,
        hasIBOM,
        kitspaceYAML,
        zipUrl,
        boardBomInfo,
        boardSpecs: { width, height, layers },
        readme,
        isSynced: repo?.mirror,
        // Whether the project were empty or not at the time of requesting the this page from the server.
        isEmpty: repo?.empty,
        user: params.username,
        projectName: params.projectName,
        isNew: query.create === 'true',
        boardAssetsExist: gerberInfoExists && boardBomInfoExists,
        readmeExists: readme !== null,
        kitspaceYAMLExists,
        finishedProcessing,
        description: kitspaceYAML?.summary || repo?.description,
        originalUrl: repo?.original_url,
      },
    }
  }
  return { notFound: true }
}

const SubProjectsGrid = ({ projects, parentProject }) => {
  return (
    <Page title={parentProject}>
      <h1>{parentProject}</h1>
      <div>
        {projects.map((project, i) => (
          <ProjectCard {...project} key={i} />
        ))}
      </div>
    </Page>
  )
}

const ProjectPage = props => {
  if (props?.subProjects)
    return (
      <SubProjectsGrid
        projects={props.subProjects}
        parentProject={props.parentProject}
      />
    )

  return <SharedProjectPage {...props} />
}

SubProjectsGrid.defaultProps = {
  projects: arrayOf(object).isRequired,
  parentProject: string,
}

export default ProjectPage
