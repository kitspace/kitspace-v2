import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Loader, Message } from 'semantic-ui-react'

import Page from '@components/Page'
import { useMigrationStatus, useRepo } from '@hooks/Gitea'
import PageElements from './elements'
import useProcessingStatus from '@hooks/useProcessingStatus'

const SharedProjectPage = props => {
  const { reload } = useRouter()
  const title = `${props.projectName} on Kitspace`
  const { repo: project } = useRepo(props.projectFullname, {
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

  useEffect(() => {
    if (!props.finishedProcessing && done) reload()
  }, [props.finishedProcessing, done, reload])

  if (!props.finishedProcessing) {
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
        description={project.description || props.description}
        previewOnly={props.isSynced}
        owner={props.user}
      />
    </Page>
  )
}

export default SharedProjectPage
