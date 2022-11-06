import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import ErrorPage from '@pages/_error'
import { getRepo, repoExists } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'
import { waitFor } from '@utils/index'
import { getKitspaceYamlArray } from '@utils/projectPage'
import getConfig from 'next/config'
import React from 'react'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'
import ProjectPage from './[project]'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

const fetchSearch = async (...args) => {
  const searchResult = await meiliIndex.search(...args)
  return searchResult.hits
}

const RepoPage = props => {
  if (props.errorCode) {
    return <ErrorPage statusCode={props.errorCode} />
  }

  if (props.projectGridProps) {
    const { swrFallback, initialProps } = props.projectGridProps
    return (
      <SWRConfig value={{ fallback: swrFallback }}>
        <ProjectGrid {...initialProps} />
      </SWRConfig>
    )
  }

  return <ProjectPage {...props.projectProps} />
}

const ProjectGrid = ({ parentProject, searchArgs }) => {
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

RepoPage.getInitialProps = async args => {
  const { query, res } = args
  const { user: username, repo: repoName } = query

  const repoFullName = `${username}/${repoName}`
  const rootAssetsPath = `${processorUrl}/files/${repoFullName}/HEAD`

  const exists = await repoExists(repoFullName)
  if (!exists) {
    if (res != null) {
      res.statusCode = 404
    }
    return { errorCode: 404 }
  }

  const getYaml = async () => (await getKitspaceYamlArray(rootAssetsPath))[1]
  const kitspaceYamlArray = waitFor(getYaml, { timeout: 60_000 })
  if (!kitspaceYamlArray) {
    if (res != null) {
      res.statusCode = 502
    }
    return { errorCode: 502 }
  }

  const isSingleProject =
    kitspaceYamlArray.length === 1 && kitspaceYamlArray[0].name === '_'

  if (isSingleProject) {
    // render the project page as this page
    args.query = { ...query, project: '_' }
    const projectProps = await ProjectPage.getInitialProps(args)
    return { projectProps }
  }

  const repo = await getRepo(repoFullName)
  const searchArgs = ['*', { filter: `multiParentId = ${repo.id}` }]
  const hits = await fetchSearch(...searchArgs)
  return {
    projectGridProps: {
      swrFallback: {
        [unstable_serialize(searchArgs)]: hits,
      },
      initialProps: {
        searchArgs: searchArgs,
        parentProject: repoName,
      },
    },
  }
}

export default RepoPage
