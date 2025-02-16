import React from 'react'
import getConfig from 'next/config'
import type { NextPage } from 'next'

import { getRepo } from '@utils/giteaApi'
import {
  getBoardBomInfo,
  getBoardGerberInfo,
  getKitspaceYamlArray,
  hasInteractiveBom,
  getIsProcessingDone,
  getReadme,
} from '@utils/projectPage'
import SharedProjectPage from '@components/SharedProjectPage'
import ErrorPage from '@pages/_error'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_ASSET_URL

const MultiProjectPage: NextPage<{ notFound?: boolean }> = props =>
  props.notFound ? <ErrorPage statusCode={404} /> : <SharedProjectPage {...props} />

MultiProjectPage.getInitialProps = async ({ query, res = null }) => {
  const userLowerCase = (query.user as string).toLowerCase()
  const repoLowerCase = (query.repo as string).toLowerCase()
  const projectName = query.project

  const repo = await getRepo(`${userLowerCase}/${repoLowerCase}`)
  if (repo) {
    const repoName = repo.name
    const username = repo.owner.login
    const repoFullName = `${username}/${repoName}`
    const rootAssetPath = `${assetUrl}/${repoFullName}/HEAD`
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
      // Whether the project was empty or not at the time of requesting this
      // page from the server.
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

export default MultiProjectPage
