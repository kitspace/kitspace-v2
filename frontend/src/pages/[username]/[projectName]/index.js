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
import ErrorPage from '@pages/_error'

const ProjectPage = props => {
  if (props.notFound) {
    return <ErrorPage statusCode={404} />
  }

  if (props?.subProjects)
    return (
      <SubProjectsGrid
        projects={props.subProjects}
        parentProject={props.parentProject}
      />
    )

  return <SharedProjectPage {...props} />
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

ProjectPage.getInitialProps = async ({ asPath, query, req }) => {
  const [ignored, username, projectName] = asPath.split('/')

  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  // `repoFullname` is resolved by matching its name against the `page` dir.
  // Then it's used to access the repo by the Gitea API.
  const repoFullname = `${username}/${projectName}`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD`
  const session = req?.session ?? window?.session

  if (await repoExists(repoFullname)) {
    const [
      repo,
      readme,
      [bomInfoExists, bomInfo],
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
      canCommit(repoFullname, session?.user?.username),
    ])

    const isMultiProject = kitspaceYAML.hasOwnProperty('multi')

    if (isMultiProject && finishedProcessing) {
      const flattenedProjects = await getFlatProjects([repo])
      return {
        subProjects: flattenedProjects,
        parentProject: projectName,
      }
    }

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    return {
      assetsPath,
      repo,
      projectFullname: repoFullname,
      hasUploadPermission,
      hasIBOM,
      kitspaceYAML,
      zipUrl,
      bomInfo,
      boardSpecs: { width, height, layers },
      readme,
      isSynced: repo?.mirror,
      // Whether the project were empty or not at the time of requesting the this page from the server.
      isEmpty: repo?.empty,
      user: username,
      projectName: projectName,
      isNew: query.create === 'true',
      gerberInfoExists,
      bomInfoExists,
      readmeExists: readme !== null,
      kitspaceYAMLExists,
      boardShowcaseAssetsExist: gerberInfoExists,
      finishedProcessing,
      description: kitspaceYAML?.summary || repo?.description,
      originalUrl: repo?.original_url,
    }
  }
  return { notFound: true }
}

SubProjectsGrid.defaultProps = {
  projects: arrayOf(object).isRequired,
  parentProject: string,
}

export default ProjectPage
