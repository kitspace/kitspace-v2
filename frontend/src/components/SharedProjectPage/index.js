import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Loader, Message } from 'semantic-ui-react'

import Page from '@components/Page'
import { useMigrationStatus, useRepo } from '@hooks/Gitea'
import ErrorPage from '@pages/_error'
import PageElements from './elements'
import useProcessingStatus from '@hooks/useProcessingStatus'

const SharedProjectPage = props => {
  const { full_name: projectFullname } = props.repo
  const { reload } = useRouter()
  const title = `${props.projectName} on Kitspace`
  const {
    repo: project,
    isLoading,
    isError,
  } = useRepo(projectFullname, {
    initialData: props.repo,
  })

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
    props.assetsPath,
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

  if (isLoading) {
    return (
      <Page title={title}>
        <Loader active />
      </Page>
    )
  }

  if (!props.finishedProcessing && done === false) {
    // done === false because done can be `undefined`.
    return (
      <Page title={title}>
        <Loader data-cy="processing-loader" active>
          Processing repository...
        </Loader>
      </Page>
    )
  }

  if (isSyncing) {
    return (
      <Page title={title}>
        <Loader active>Syncing repository...</Loader>
      </Page>
    )
  }
  if (migrationStatus === 'Failed') {
    return (
      <Page title={title}>
        <Loader active>Migration Failed, please try again later!</Loader>
      </Page>
    )
  }
  if (isError) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Page title={title}>
      {props.isSynced && props.hasUploadPermission ? (
        <Message data-cy="sync-msg" color="yellow">
          <Message.Header>A synced repository!</Message.Header>
          <Message.Content>
            <p>Files uploading isn&apos;t supported for synced repositories.</p>
            Please commit files to the original git repository and it will be synced
            automatically.
          </Message.Content>
        </Message>
      ) : null}
      <PageElements
        {...props}
        projectFullname={projectFullname}
        description={project?.description}
        previewOnly={props.isSynced}
        url={project?.original_url}
        owner={props.user}
        name={props.projectName}
      />
    </Page>
  )
}

export default SharedProjectPage
