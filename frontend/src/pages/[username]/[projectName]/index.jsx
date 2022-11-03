import React from 'react'
import getConfig from 'next/config'

import { canCommit, getRepo, repoExists } from '@utils/giteaApi'
import {
  getBoardBomInfo,
  getBoardGerberInfo,
  getKitspaceYamlArray,
  hasInteractiveBom,
  getIsProcessingDone,
  getReadme,
} from '@utils/projectPage'
import SharedProjectPage from '@components/SharedProjectPage'
import { arrayOf, bool, object, string } from 'prop-types'
import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import Custom404 from '@pages/404'
import { meiliIndex } from '@utils/meili'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

const ProjectPage = props => {
  if (props.notFound) {
    return <Custom404 />
  }

  if (props?.subProjects) {
    return (
      <SubProjectsGrid
        parentProject={props.parentProject}
        projects={props.subProjects}
      />
    )
  }

  return <SharedProjectPage {...props} />
}

const SubProjectsGrid = ({ projects, parentProject }) => {
  return (
    <Page title={parentProject}>
      <h1>{parentProject}</h1>
      <div>
        {projects.map(project => (
          <ProjectCard {...project} key={project.id} />
        ))}
      </div>
    </Page>
  )
}

ProjectPage.getInitialProps = async ({ query, req, res }) => {
  const { username, projectName } = query

  const repoFullname = `${username}/${projectName}`
  const rootAssetsPath = `${processorUrl}/files/${repoFullname}/HEAD`
  const assetsPath = `${rootAssetsPath}/_`
  const session = req?.session ?? JSON.parse(sessionStorage.getItem('session'))

  const exists = await repoExists(repoFullname)
  if (exists) {
    const [
      repo,
      readme,
      [bomInfoExists, bomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYamlExists, kitspaceYamlArray],
      finishedProcessing,
      hasIBOM,
      // The repo owner and collaborators can upload files.
      hasUploadPermission,
    ] = await Promise.all([
      getRepo(repoFullname),
      getReadme(assetsPath),
      getBoardBomInfo(assetsPath),
      getBoardGerberInfo(assetsPath),
      getKitspaceYamlArray(rootAssetsPath),
      getIsProcessingDone(assetsPath),
      hasInteractiveBom(assetsPath),
      canCommit(repoFullname, session.user?.username, session.apiToken),
    ])

    const isSingleProject =
      kitspaceYamlArray.length === 1 && kitspaceYamlArray[0].name === '_'

    if (!isSingleProject && finishedProcessing) {
      const searchResult = await meiliIndex.search('*', {
        filter: `multiParentId = ${repo.id}`,
      })
      return {
        subProjects: searchResult.hits,
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
      kitspaceYAML: kitspaceYamlArray[0],
      zipUrl,
      bomInfo,
      boardSpecs: { width, height, layers },
      readme,
      isSynced: repo?.mirror,
      // Whether the project was empty or not at the time of requesting the
      // this page from the server.
      isEmpty: repo?.empty,
      username,
      projectName: projectName,
      isNew: query.create === 'true',
      gerberInfoExists,
      bomInfoExists,
      readmeExists: readme !== null,
      kitspaceYAMLExists: kitspaceYamlExists,
      boardShowcaseAssetsExist: gerberInfoExists,
      finishedProcessing,
      description: kitspaceYamlArray.summary,
      originalUrl: repo?.original_url,
    }
  }

  res.statusCode = 404
  return { notFound: true }
}

ProjectPage.propTypes = {
  notFound: bool,
  subProjects: arrayOf(object),
  parentProject: string,
}

ProjectPage.defaultProps = {
  notFound: false,
  parentProject: '',
}

SubProjectsGrid.propTypes = {
  projects: arrayOf(object).isRequired,
  parentProject: string.isRequired,
}

export default ProjectPage
