import React from 'react'

import {
  canCommit,
  getDefaultBranchFiles,
  getRepo,
  repoExists,
} from '@utils/giteaApi'
import { findReadme, renderReadme } from '@utils/index'
import {
  getBoardBomInfo,
  getBoardGerberInfo,
  getKitspaceYAMLJson,
  hasInteractiveBom,
  getIsProcessingDone,
} from '@utils/projectPage'
import SharedProjectPage from '@components/SharedProjectPage'

export const getServerSideProps = async ({ params, query, req }) => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  // `repoFullname` is resolved by matching its name against the `page` dir.
  // Then it's used to access the repo by the Gitea API.
  const { multiProjectName, username, projectName } = params
  const repoFullname = `${username}/${projectName}`

  const kitspaceYAMLPath = `${processorUrl}/files/${repoFullname}/HEAD`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD/${multiProjectName}`

  if (await repoExists(repoFullname)) {
    const [
      repo,
      repoFiles,
      [boardBomInfoExists, boardBomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYAMLExists, kitspaceYAML],
      finishedProcessing,
      hasIBOM,
      hasUploadPermission,
    ] = await Promise.all([
      getRepo(repoFullname),
      getDefaultBranchFiles(repoFullname),
      getBoardBomInfo(assetsPath),
      getBoardGerberInfo(assetsPath),
      getKitspaceYAMLJson(kitspaceYAMLPath),
      getIsProcessingDone(assetsPath),
      hasInteractiveBom(assetsPath),
      // The repo owner and collaborators can upload files.
      canCommit(repoFullname, req?.session?.user?.username),
    ])

    const projectKitspaceYAML = kitspaceYAML.multi[multiProjectName]

    const readmeFile = projectKitspaceYAML?.readme || findReadme(repoFiles)
    const renderedReadme = await renderReadme(repoFullname, readmeFile)

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    return {
      props: {
        assetsPath,
        repo,
        projectFullname: repoFullname,
        hasUploadPermission,
        repoFiles,
        hasIBOM,
        kitspaceYAML: projectKitspaceYAML,
        zipUrl,
        boardBomInfo,
        boardSpecs: { width, height, layers },
        renderedReadme,
        isSynced: repo?.mirror,
        // Whether the project were empty or not at the time of requesting the this page from the server.
        isEmpty: repo?.empty,
        user: params.username,
        projectName: multiProjectName,
        isNew: query.create === 'true',
        boardAssetsExist: gerberInfoExists && boardBomInfoExists,
        readmeExists: readmeFile !== '',
        kitspaceYAMLExists,
        finishedProcessing,
        description: projectKitspaceYAML?.summary || repo?.description,
        url: repo?.original_url,
      },
    }
  }
  return { notFound: true }
}

const MultiProjectPage = props => <SharedProjectPage {...props} />
export default MultiProjectPage
