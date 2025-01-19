import React from 'react'
import { NextPageContext } from 'next'
import getConfig from 'next/config'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'

import { getKitspaceYamlArray } from '@utils/projectPage'
import { getRepo, repoExists } from '@utils/giteaApi'
import { waitFor } from '@utils/index'
import Project from '@models/Project'
import { searchFetcher, SearchFetcherParams } from '@hooks/useLazySearch'
import ProjectCardGrid from '@components/ProjectCardGrid'
import ErrorPage from '@pages/_error'
import Page from '@components/Page'
import ProjectPage from './[project]'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_ASSET_URL

interface RepoPageProps {
  errorCode?: number
  projectGrid?: ProjectGridData
  singleProject?: Record<string, unknown>
}

const RepoPage = (props: RepoPageProps) => {
  if (props.errorCode) {
    return <ErrorPage statusCode={props.errorCode} />
  }

  if (props.projectGrid) {
    const { swrFallback, gridProps } = props.projectGrid
    return (
      <SWRConfig value={{ fallback: swrFallback }}>
        <PageContent {...gridProps} />
      </SWRConfig>
    )
  }

  return <ProjectPage {...props.singleProject} />
}

RepoPage.getInitialProps = async (ctx: NextPageContext): Promise<RepoPageProps> => {
  const { query, res } = ctx

  const username = (query.user as string).toLowerCase()
  const repoName = (query.repo as string).toLowerCase()

  const exists = await repoExists(`${username}/${repoName}`)

  if (!exists) {
    if (res != null) {
      res.statusCode = 404
    }
    return { errorCode: 404 }
  }

  const kitspaceYamlArray = await getYamlArray(username, repoName)

  if (!kitspaceYamlArray) {
    if (res != null) {
      res.statusCode = 500
    }
    return { errorCode: 500 }
  }

  const isSingleProject =
    kitspaceYamlArray.length === 1 && kitspaceYamlArray[0].name === '_'

  if (isSingleProject) {
    // render the project page as this page
    return { singleProject: await getProjectPageProps(ctx) }
  }

  return { projectGrid: await getGridData(username, repoName) }
}

interface ProjectGridData {
  swrFallback: Record<string, Array<Project>>
  gridProps: ProjectGridProps
}

interface ProjectGridProps {
  parentProject: string
  searchParams: SearchFetcherParams
}

const PageContent = ({ parentProject, searchParams }: ProjectGridProps) => {
  const { data: projects = [] } = useSWR(searchParams, searchFetcher, {
    refreshInterval: 1000,
  })
  const isProcessing = projects.length === 0

  return (
    <Page title={parentProject}>
      <h1>{parentProject}</h1>
      {isProcessing ? (
        <p>Processing repository...</p>
      ) : (
        <ProjectCardGrid projects={projects} />
      )}
    </Page>
  )
}

const getGridData = async (
  username: string,
  repoName: string,
): Promise<ProjectGridData> => {
  const repoFullName = `${username}/${repoName}`
  const repo = await getRepo(repoFullName)
  const searchParams = { filter: `repoId = ${repo.id}`, limit: 1000 }
  const hits = await searchFetcher(searchParams)
  return {
    swrFallback: {
      [unstable_serialize(searchParams)]: hits,
    },
    gridProps: {
      searchParams,
      parentProject: repoName,
    },
  }
}

type YamlArray = Array<{ name: string } & Record<string, unknown>>

const getYamlArray = (
  username: string,
  repoName: string,
): Promise<YamlArray | null> => {
  const repoFullName = `${username}/${repoName}`
  const rootAssetPath = `${assetUrl}/${repoFullName}/HEAD`
  const getYaml = async () => {
    const [ignored, arr] = await getKitspaceYamlArray(rootAssetPath)
    return arr
  }
  const checkFn = arr => arr.length > 0
  return waitFor(getYaml, { timeoutMs: 60_000, checkFn })
}

const getProjectPageProps = (
  ctx: NextPageContext,
): Promise<Record<string, unknown>> => {
  ctx.query = { ...ctx.query, project: '_' }
  return ProjectPage.getInitialProps(ctx)
}

export default RepoPage
