import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import ErrorPage from '@pages/_error'
import { getRepo, repoExists } from '@utils/giteaApi'
import { waitFor } from '@utils/index'
import { meiliIndex } from '@utils/meili'
import { getKitspaceYamlArray } from '@utils/projectPage'
import { SearchParams } from 'meilisearch'
import { NextPageContext } from 'next'
import getConfig from 'next/config'
import React from 'react'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'
import ProjectPage from './[project]'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

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
        <ProjectGrid {...gridProps} />
      </SWRConfig>
    )
  }

  return <ProjectPage {...props.singleProject} />
}

RepoPage.getInitialProps = async (ctx: NextPageContext): Promise<RepoPageProps> => {
  const { query, res } = ctx
  const { user: username, repo: repoName } = query

  if (Array.isArray(username) || Array.isArray(repoName)) {
    // this really can't happen but the types tell us it could
    if (res != null) {
      res.statusCode = 400
    }
    return { errorCode: 400 }
  }

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
  swrFallback: Record<string, Array<unknown>>
  gridProps: ProjectGridProps
}

interface ProjectGridProps {
  parentProject: string
  searchArgs: SearchArgs
}

const ProjectGrid = ({ parentProject, searchArgs }: ProjectGridProps) => {
  const { data: projects } = useSWR(searchArgs, fetchSearch, {
    refreshInterval: 1000,
  })
  const isProcessing = projects.length === 0
  return (
    <Page title={parentProject}>
      <h1>{parentProject}</h1>
      <div>
        {isProcessing
          ? 'Processing repository...'
          : projects.map(project => <ProjectCard {...project} key={project.id} />)}
      </div>
    </Page>
  )
}

type SearchArgs = [string, SearchParams]

const fetchSearch = async (...args: SearchArgs) => {
  const searchResult = await meiliIndex.search(...args)
  return searchResult.hits
}

const getGridData = async (
  username: string,
  repoName: string,
): Promise<ProjectGridData> => {
  const repoFullName = `${username}/${repoName}`
  const repo = await getRepo(repoFullName)
  const searchArgs: SearchArgs = ['*', { filter: `repoId = ${repo.id}` }]
  const hits = await fetchSearch(...searchArgs)
  return {
    swrFallback: {
      [unstable_serialize(searchArgs)]: hits,
    },
    gridProps: {
      searchArgs: searchArgs,
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
  const rootAssetsPath = `${processorUrl}/files/${repoFullName}/HEAD`
  const getYaml = async () => {
    const [ignored, arr] = await getKitspaceYamlArray(rootAssetsPath)
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
