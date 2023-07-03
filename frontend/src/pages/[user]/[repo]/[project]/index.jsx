import React from 'react'
import { bool } from 'prop-types'
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
import Custom404 from '@pages/404'

const assetUrl = getConfig().publicRuntimeConfig.KITSPACE_ASSET_URL

const MultiProjectPage = props =>
  props.notFound ? <Custom404 /> : <SharedProjectPage {...props} />

MultiProjectPage.getInitialProps = async ({ query, req = null, res = null }) => {
  const { user: username, repo: repoName, project: projectName } = query

  const repoFullName = `${username}/${repoName}`

  const rootAssetPath = `${assetUrl}/${repoFullName}/HEAD`
  const assetPath = `${rootAssetPath}/${projectName}`
  const session = req?.session ?? JSON.parse(sessionStorage.getItem('session'))

  const exists = await repoExists(repoFullName)
  if (exists) {
    const [
      repo,
      readme,
      [bomInfoExists, bomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYAMLExists, kitspaceYamlArray],
      finishedProcessing,
      hasIBOM,
      hasUploadPermission,
    ] = await Promise.all([
      getRepo(repoFullName),
      getReadme(assetPath),
      getBoardBomInfo(assetPath),
      getBoardGerberInfo(assetPath),
      getKitspaceYamlArray(rootAssetPath),
      getIsProcessingDone(rootAssetPath),
      hasInteractiveBom(assetPath),
      // The repo owner and collaborators can upload files.
      canCommit(repoFullName, session.user?.username, session.apiToken),
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
      hasUploadPermission,
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

MultiProjectPage.propTypes = {
  notFound: bool,
}

MultiProjectPage.defaultProps = {
  notFound: false,
}

export default MultiProjectPage
