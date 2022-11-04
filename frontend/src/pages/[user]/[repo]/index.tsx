import Page from '@components/Page'
import ProjectCard from '@components/ProjectCard'
import ErrorPage from '@pages/_error'
import { getRepo, repoExists } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'
import { SearchParams } from 'meilisearch'
import { waitFor } from '@utils/index'
import { getKitspaceYamlArray } from '@utils/projectPage'
import getConfig from 'next/config'
import React from 'react'
import useSWR, { SWRConfig, unstable_serialize } from 'swr'
import ProjectPage from './[project]'

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

type SearchArgs = [string, SearchParams]

const fetchSearch = async (...args: SearchArgs) => {
  const searchResult = await meiliIndex.search(...args)
  return searchResult.hits
}

interface RepoPageProps {
  errorCode?: number
  projectGrid?: {
    swrFallback: Record<string, Array<unknown>>
    gridProps: ProjectGridProps
  }
  singleProject?: object
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

RepoPage.getInitialProps = async (args): Promise<RepoPageProps> => {
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

  const getYaml = async () => {
    const [ignored, arr] = await getKitspaceYamlArray(rootAssetsPath)
    return arr
  }
  const checkFn = arr => arr.length > 0
  const kitspaceYamlArray = await waitFor(getYaml, { timeoutMs: 10_000, checkFn })
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
    const singleProject = await ProjectPage.getInitialProps(args)
    return { singleProject }
  }

  const repo = await getRepo(repoFullName)
  const searchArgs: SearchArgs = ['*', { filter: `multiParentId = ${repo.id}` }]
  const hits = await fetchSearch(...searchArgs)
  return {
    projectGrid: {
      swrFallback: {
        [unstable_serialize(searchArgs)]: hits,
      },
      gridProps: {
        searchArgs: searchArgs,
        parentProject: repoName,
      },
    },
  }
}

export default RepoPage
