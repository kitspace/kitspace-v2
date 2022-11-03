import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import Custom404 from '@pages/404'
import { getRepo, repoExists } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'
import { getKitspaceYamlArray } from '@utils/projectPage'
import getConfig from 'next/config'
import React from 'react'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'
import MultiProjectPage from './[multiProjectName]'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

const fetchSearch = async (...args) => {
  const searchResult = await meiliIndex.search(...args)
  return searchResult.hits
}

const ProjectPage = props => {
  if (props.notFound) {
    return <Custom404 />
  }

  if (props.projectGridProps) {
    const { swrFallback, initialProps } = props.projectGridProps
    return (
      <SWRConfig value={{ fallback: swrFallback }}>
        <SubProjectsGrid {...initialProps} />
      </SWRConfig>
    )
  }

  return <MultiProjectPage {...props.projectProps} />
}

const SubProjectsGrid = ({ parentProject, searchArgs }) => {
  const { data: projects } = useSWR(searchArgs, fetchSearch, {
    refreshInterval: 1000,
  })
  const isProcessing = projects.length === 0
  return (
    <Page title={parentProject}>
      <h1>{parentProject}</h1>
      <div>
        {isProcessing
          ? 'Processing repo...'
          : projects.map(project => <ProjectCard {...project} key={project.id} />)}
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
    let [ignored, kitspaceYamlArray] = await getKitspaceYamlArray(rootAssetsPath)

    // TODO: get rid of this while loop by using SWR
    while (kitspaceYamlArray.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
      ;[ignored, kitspaceYamlArray] = await getKitspaceYamlArray(rootAssetsPath)
    }

    const isSingleProject =
      kitspaceYamlArray.length === 1 && kitspaceYamlArray[0].name === '_'

    if (isSingleProject) {
      args.query = { ...query, multiProjectName: '_' }
      const projectProps = await MultiProjectPage.getInitialProps(args)
      return { projectProps }
    }

    const repo = await getRepo(repoFullname)
    const searchArgs = ['*', { filter: `multiParentId = ${repo.id}` }]
    const hits = await fetchSearch(...searchArgs)
    return {
      projectGridProps: {
        swrFallback: {
          [unstable_serialize(searchArgs)]: hits,
        },
        initialProps: {
          searchArgs: searchArgs,
          parentProject: projectName,
        },
      },
    }
  }

  if (res != null) {
    res.statusCode = 404
  }
  return { notFound: true }
}

export default ProjectPage
