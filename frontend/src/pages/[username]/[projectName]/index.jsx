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
import MultiProjectPage from './[multiProjectName]'
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

  if (props.projectGridProps) {
    return <SubProjectsGrid {...props.projectGridProps} />
  }

  return <MultiProjectPage {...props.projectProps} />
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

ProjectPage.getInitialProps = async args => {
  const { query, res } = args
  const { username, projectName } = query

  const repoFullname = `${username}/${projectName}`
  const rootAssetsPath = `${processorUrl}/files/${repoFullname}/HEAD`

  const exists = await repoExists(repoFullname)
  if (exists) {
    const [ignored, kitspaceYamlArray] = await getKitspaceYamlArray(rootAssetsPath)
    const isSingleProject =
      kitspaceYamlArray.length === 1 && kitspaceYamlArray[0].name === '_'

    if (isSingleProject) {
      const projectProps = await MultiProjectPage.getInitialProps(args)
      return { projectProps }
    }

    const repo = await getRepo(repoFullname)
    const searchResult = await meiliIndex.search('*', {
      filter: `multiParentId = ${repo.id}`,
    })
    return {
      projectGridProps: {
        projects: searchResult.hits,
        parentProject: projectName,
      },
    }
  }

  if (res != null) {
    res.statusCode = 404
  }
  return { notFound: true }
}

SubProjectsGrid.propTypes = {
  projects: arrayOf(object).isRequired,
  parentProject: string.isRequired,
}

export default ProjectPage
