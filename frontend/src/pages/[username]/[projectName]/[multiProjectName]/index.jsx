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

const processorUrl = getConfig().publicRuntimeConfig.KITSPACE_PROCESSOR_URL

const MultiProjectPage = props =>
  props.notFound ? <Custom404 /> : <SharedProjectPage {...props} />

MultiProjectPage.getInitialProps = async ({ asPath, query, req, res }) => {
  // `repoFullname` is resolved by matching its name against the `page` dir.
  // Then it's used to access the repo by the Gitea API.
  const asPathWithoutQuery = asPath.split('?')[0]
  const [ignored, username, projectName, multiProjectName] =
    asPathWithoutQuery.split('/')

  const repoFullname = `${username}/${projectName}`

  const kitspaceYAMLPath = `${processorUrl}/files/${repoFullname}/HEAD`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD/${multiProjectName}`
  const session = req?.session ?? JSON.parse(sessionStorage.getItem('session'))

  if (await repoExists(repoFullname)) {
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
      getRepo(repoFullname),
      getReadme(assetsPath),
      getBoardBomInfo(assetsPath),
      getBoardGerberInfo(assetsPath),
      getKitspaceYamlArray(kitspaceYAMLPath),
      getIsProcessingDone(assetsPath),
      hasInteractiveBom(assetsPath),
      // The repo owner and collaborators can upload files.
      canCommit(repoFullname, session.user?.username, session.apiToken),
    ])

    const kitspaceYAML = kitspaceYamlArray.find(p => p.name === multiProjectName)

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    if (!kitspaceYAML) {
      // If there is not multiproject as specified in the url `{username}/{projectName}/{multiProjectName}`
      res.statusCode = 404
      return { notFound: true }
    }

    return {
      assetsPath,
      repo,
      projectFullname: repoFullname,
      hasUploadPermission,
      hasIBOM,
      kitspaceYAML,
      zipUrl,
      bomInfo,
      boardSpecs: { width, height, layers },
      readme,
      isSynced: repo?.mirror,
      // Whether the project were empty or not at the time of requesting the this page from the server.
      isEmpty: repo?.empty,
      username,
      projectName: multiProjectName === '_' ? projectName : multiProjectName,
      isNew: query.create === 'true',
      gerberInfoExists,
      bomInfoExists,
      readmeExists: readme !== null,
      kitspaceYAMLExists,
      boardShowcaseAssetsExist: gerberInfoExists,
      finishedProcessing,
      description: kitspaceYAML.summary,
      originalUrl: repo?.original_url,
    }
  }

  res.statusCode = 404
  return { notFound: true }
}

MultiProjectPage.propTypes = {
  notFound: bool,
}

MultiProjectPage.defaultProps = {
  notFound: false,
}

export default MultiProjectPage
