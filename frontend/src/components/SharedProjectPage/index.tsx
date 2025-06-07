import React, { useEffect, useState } from 'react'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'

import Page from '@components/Page'
import Head from '@components/Head'
import { useMigrationStatus } from '@hooks/Gitea'
import useProcessingStatus from '@hooks/useProcessingStatus'
import PageElements from './elements'

const { KITSPACE_DOMAIN } = getConfig().publicRuntimeConfig

export type SharedProjectPageProps = {
  rootAssetPath: string
  repo: any
  projectFullname: string
  hasIBOM: boolean
  kitspaceYAML: any
  zipUrl: string
  bomInfo: any
  boardSpecs: { width: any; height: any; layers: any }
  readme: string
  isSynced: boolean
  isEmpty: boolean
  username: string
  projectName: string
  repoName: string
  gerberInfoExists: boolean
  bomInfoExists: boolean
  readmeExists: boolean
  kitspaceYAMLExists: boolean
  boardShowcaseAssetsExist: boolean
  finishedProcessing: boolean
  ogDescription: string
  description: string
  originalUrl: string
}

const SharedProjectPage: React.FC<SharedProjectPageProps> = props => {
  const { reload } = useRouter()
  const title = `${
    props.projectName === '_' ? props.repoName : props.projectName
  } on Kitspace`

  const [isSyncing, setIsSyncing] = useState(props.isEmpty)
  // If the repo is migrating, poll for update every second, otherwise use default config.
  const { status: migrationStatus } = useMigrationStatus(
    props.repo.id,
    props.isEmpty && isSyncing,
    {
      refreshInterval: 1000,
    },
  )

  const { done } = useProcessingStatus(
    props.rootAssetPath,
    !props.finishedProcessing,
    {
      refreshInterval: 1000,
    },
  )

  useEffect(() => {
    setIsSyncing(migrationStatus === 'Queue' || migrationStatus === 'Running')

    if (props.isEmpty && !props.isSynced && migrationStatus === 'Finished') {
      reload()
    }
  }, [migrationStatus, props.isEmpty, props.isSynced, reload])

  useEffect(() => {
    if (!props.finishedProcessing && done) {
      reload()
    }
  }, [props.finishedProcessing, done, reload])

  if (!props.finishedProcessing) {
    return (
      <Page>
        <Loader active data-cy="processing-loader">
          Processing repository...
        </Loader>
      </Page>
    )
  }

  if (isSyncing) {
    return (
      <Page>
        <Loader active>Syncing repository...</Loader>
      </Page>
    )
  }
  if (migrationStatus === 'Failed') {
    return (
      <Page>
        <Loader active>Migration Failed, please try again later!</Loader>
      </Page>
    )
  }

  return (
    <Page>
      <Head
        ogDescription={props.ogDescription}
        ogImage={`${props.rootAssetPath}/${props.projectName}/images/top-with-background.png`}
        title={title}
        url={`https://${KITSPACE_DOMAIN}/${props.username}/${props.repoName}`}
      />
      <PageElements
        {...props}
        assetPath={`${props.rootAssetPath}/${props.projectName}`}
        description={props.description}
        previewOnly={props.isSynced}
      />
    </Page>
  )
}

export default SharedProjectPage
