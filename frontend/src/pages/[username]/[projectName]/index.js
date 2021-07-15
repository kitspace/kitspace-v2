// TODO: this page became monolithic, it needs global refactoring.
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
  const repoFullname = `${params.username}/${params.projectName}`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD`

  if (await repoExists(repoFullname)) {
    const [
      repo,
      repoFiles,
      [boardBomInfoExists, boardBomInfo],
      [gerberInfoExists, gerberInfo],
      [kitspaceYAMLExists, kitspaceYAML],
      finishedProcessing,
      hasIBOM,
      // The repo owner and collaborators can upload files.
      hasUploadPermission,
    ] = await Promise.all([
      getRepo(repoFullname),
      getDefaultBranchFiles(repoFullname),
      getBoardBomInfo(assetsPath),
      getBoardGerberInfo(assetsPath),
      getKitspaceYAMLJson(assetsPath),
      getIsProcessingDone(assetsPath),
      hasInteractiveBom(assetsPath),
      canCommit(repoFullname, req?.session?.user?.username),
    ])

    const readmeFile = kitspaceYAML?.readme || findReadme(repoFiles)
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
        kitspaceYAML,
        zipUrl,
        boardBomInfo,
        boardSpecs: { width, height, layers },
        renderedReadme,
        isSynced: repo?.mirror,
        // Whether the project were empty or not at the time of requesting the this page from the server.
        isEmpty: repo?.empty,
        user: params.username,
        projectName: params.projectName,
        isNew: query.create === 'true',
        boardAssetsExist: gerberInfoExists && boardBomInfoExists,
        readmeExists: readmeFile !== '',
        kitspaceYAMLExists,
        finishedProcessing,
        description: kitspaceYAML?.summary || repo?.description,
        url: repo?.original_url,
      },
    }
  }
  return { notFound: true }
}

const ProjectPage = props => <SharedProjectPage {...props} />

export default ProjectPage
