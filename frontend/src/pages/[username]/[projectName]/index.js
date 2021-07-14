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
  processedAssets,
} from '@utils/projectPage'
import SharedProjectPage from '@components/SharedProjectPage'

export const getServerSideProps = async ({ params, query, req }) => {
  const processorUrl = process.env.KITSPACE_PROCESSOR_URL
  // `repoFullname` is resolved by matching its name against the `page` dir.
  // Then it's used to access the repo by the Gitea API.
  const repoFullname = `${params.username}/${params.projectName}`
  const assetsPath = `${processorUrl}/files/${repoFullname}/HEAD`

  // The repo owner and collaborators can upload files.
  const hasUploadPermission = await canCommit(
    repoFullname,
    req?.session?.user?.username,
  )

  if (await repoExists(repoFullname)) {
    const repo = await getRepo(repoFullname)
    const repoFiles = await getDefaultBranchFiles(repoFullname)

    // TODO: ALL assets aren't available for the repos which are being processed,
    // or the repos that don't have assets from first place.
    // This should be handled properly currently, it breaks the page.
    const [gerberInfoExists, gerberInfo] = await getBoardGerberInfo(assetsPath)
    const [boardBomInfoExists, boardBomInfo] = await getBoardBomInfo(assetsPath)
    const [kitspaceYAMLExists, kitspaceYAML] = await getKitspaceYAMLJson(assetsPath)
    const finishedProcessing = await processedAssets(assetsPath)

    const { zipPath, width, height, layers } = gerberInfo
    const zipUrl = `${assetsPath}/${zipPath}`

    const readmeFile = kitspaceYAML?.readme || findReadme(repoFiles)
    const renderedReadme = await renderReadme(repoFullname, readmeFile)

    const hasIBOM = await hasInteractiveBom(assetsPath)

    return {
      props: {
        assetsPath,
        repo,
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
      },
    }
  }
  return { notFound: true }
}

const ProjectPage = props => <SharedProjectPage {...props} />

export default ProjectPage
