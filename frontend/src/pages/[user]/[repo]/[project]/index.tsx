import type { NextPage } from 'next'
import getConfig from 'next/config'

import type { SharedProjectPageProps } from '@components/SharedProjectPage'
import SharedProjectPage from '@components/SharedProjectPage'
import ErrorPage from '@pages/_error'
import { getRepo } from '@utils/giteaApi'
import { meiliIndex } from '@utils/meili'
import {
  getBoardBomInfo,
  getBoardGerberInfo,
  getIsProcessingDone,
  getKitspaceYamlArray,
  getReadme,
  hasInteractiveBom,
} from '@utils/projectPage'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_ASSET_URL

export type PageProps = { notFound: true } | SharedProjectPageProps

const ProjectPage: NextPage<PageProps> = props =>
  'notFound' in props ? (
    <ErrorPage statusCode={404} />
  ) : (
    <SharedProjectPage {...props} />
  )

ProjectPage.getInitialProps = async ({ query, res = null }) => {
  const userLowerCase = (query.user as string).toLowerCase()
  const repoLowerCase = (query.repo as string).toLowerCase()
  const projectName = Array.isArray(query.project)
    ? query.project[0]
    : query.project

  const repo = await getRepo(`${userLowerCase}/${repoLowerCase}`)
  if (repo) {
    const searchResults = await meiliIndex.search('', {
      filter: [`id = ${repo.id}-${projectName}`],
    })
    const latestSha = searchResults?.hits?.[0]?.gitHash || 'HEAD'
    const repoName = repo.name
    const username = repo.owner.login
    const repoFullName = `${username}/${repoName}`
    const rootAssetPath = `${assetUrl}/${repoFullName}/${latestSha}`
    const assetPath = `${rootAssetPath}/${projectName}`
    const [
      readme,
      [bomInfoExists, bomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYAMLExists, kitspaceYamlArray],
      finishedProcessing,
      hasIBOM,
    ] = await Promise.all([
      getReadme(assetPath),
      getBoardBomInfo(assetPath),
      getBoardGerberInfo(assetPath),
      getKitspaceYamlArray(rootAssetPath),
      getIsProcessingDone(rootAssetPath),
      hasInteractiveBom(assetPath),
    ])

    const kitspaceYAML = kitspaceYamlArray.find(p => p.name === projectName)

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetPath}/${zipPath}`

    if (!kitspaceYAML) {
      // no project matched
      if (res != null) {
        res.statusCode = 404
      }
      return { notFound: true }
    }

    return {
      rootAssetPath,
      repo,
      projectFullname: repoFullName,
      hasIBOM,
      kitspaceYAML,
      zipUrl,
      bomInfo,
      boardSpecs: { width, height, layers },
      readme,
      isSynced: repo?.mirror,
      isEmpty: repo?.empty,
      username,
      projectName,
      repoName,
      gerberInfoExists,
      bomInfoExists,
      readmeExists: readme !== null,
      kitspaceYAMLExists,
      boardShowcaseAssetsExist: gerberInfoExists,
      finishedProcessing,
      ogDescription: kitspaceYAML.summary,
      description: kitspaceYAML.rendered_summary,
      originalUrl: repo?.original_url,
    }
  }

  if (res != null) {
    res.statusCode = 404
  }
  return { notFound: true }
}

export default ProjectPage
