import React, { useContext, useState } from 'react'
import { func } from 'prop-types'
import { Input, Button, Form, Message } from 'semantic-ui-react'

import { useRouter } from 'next/router'
import isEmpty from 'lodash/isEmpty'

import { AuthContext } from '@contexts/AuthContext'
import { deleteRepo, mirrorRepo } from '@utils/giteaApi'
import { urlToName } from '@utils/index'
import SyncRepoFromModel from '@models/SyncRepoForm'
import useForm from '@hooks/useForm'
import { SyncOp, NoOp } from '../Ops'
import { SyncConflictModal } from '../CondlictModals'
import styles from './index.module.scss'

const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'

const Sync = ({ setUserOp }) => {
  const { push } = useRouter()
  const { user, apiToken } = useContext(AuthContext)
  const { form, errors, onChange, clear } = useForm(SyncRepoFromModel)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({})
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const projectName = urlToName(form.url)

  const uid = user?.id
  const username = user?.username

  const handleClick = async () => {
    if (isEmpty(errors)) {
      // Syncing can be instantaneous, avoid flickering by delaying setting the user operation.
      const delayedSyncOp = setTimeout(() => setUserOp(SyncOp), 500)

      setLoading(true)
      setMessage({
        content: 'Processing the repository, this may take a while...',
        color: 'green',
      })

      const repoURL = form.url
      const repoName = urlToName(repoURL)

      const res = await mirrorRepo(repoURL, uid, apiToken)
      const migrateSuccessfully = res.ok
      const alreadySynced = res.status === 409

      if (migrateSuccessfully) {
        setMessage({
          content: 'Imported successfully, redirecting to the project page...',
          color: 'green',
        })
        const exists = waitFor(() => repoExists(`${username}/${repoName}`), {
          timeoutMS: 60_000,
        })
        if (!exists) {
          setMessage({
            content: `Sorry, something went wrong with importing this repsository.`,
            color: 'red',
          })
          return
        }
        return push(`/${username}/${repoName}`)
      } else {
        // If migration failed don't remove the uploading side.
        clearTimeout(delayedSyncOp)
        setUserOp(NoOp)

        setLoading(false)
        if (alreadySynced) {
          setConflictModalOpen(true)
        } else {
          setMessage({
            content: `Something went wrong. Are you sure "${form.url}" is a valid git repository?`,
            color: 'red',
          })
        }
      }
    } else {
      setMessage({
        content: `Please, enter a valid URL to a remote git repo e.g., ${remoteRepoPlaceHolder}`,
        color: 'yellow',
      })
    }
  }

  const onDifferentName = async repoName => {
    // Syncing can be instantaneous, avoid flickering by delaying setting the user operation.
    const delayedSyncOp = setTimeout(() => setUserOp(SyncOp), 500)

    setLoading(true)
    setConflictModalOpen(false)
    setMessage({
      content: 'Processing the repository, this may take a while...',
      color: 'green',
    })

    const repoURL = form.url

    const res = await mirrorRepo(repoURL, uid, apiToken, repoName)
    const migrateSuccessfully = res.ok

    if (migrateSuccessfully) {
      setMessage({
        content: 'Migrated successfully, redirecting the project page...',
        color: 'green',
      })
      await push(`/${username}/${repoName}`)
    } else {
      // If migration failed don't remove the uploading side.
      clearTimeout(delayedSyncOp)
      setUserOp(NoOp)

      setLoading(false)
      setMessage({
        content: `Something went wrong. Are you sure "${form.url}" is a valid git repository?`,
        color: 'red',
      })
    }
  }

  const onOverwrite = async () => {
    // Syncing can be instantaneous, avoid flickering by delaying setting the user operation.
    const delayedSyncOp = setTimeout(() => setUserOp(SyncOp), 500)

    setLoading(true)
    setConflictModalOpen(false)
    setMessage({
      content: 'Processing the repository, this may take a while...',
      color: 'green',
    })

    const repoURL = form.url
    const repoName = urlToName(repoURL)

    const deletedRepoSuccessfully = await deleteRepo(
      `${user.username}/${projectName}`,
      apiToken,
    )

    if (deletedRepoSuccessfully) {
      const res = await mirrorRepo(repoURL, uid, apiToken)
      const migrateSuccessfully = res.ok

      if (migrateSuccessfully) {
        setMessage({
          content: 'Migrated successfully, redirecting the project page...',
          color: 'green',
        })
        await push(`/${username}/${repoName}`)
        return
      } else {
        // If migration failed don't remove the uploading side.
        clearTimeout(delayedSyncOp)
        setUserOp(NoOp)

        setLoading(false)
        setMessage({
          content: `Something went wrong. Are you sure "${form.url}" is a valid git repository?`,
          color: 'red',
        })
      }
    } else {
      // If migration failed don't remove the uploading side.
      clearTimeout(delayedSyncOp)
      setUserOp(NoOp)

      setLoading(false)
      setMessage({
        content: `Couldn't overwrite "${projectName}"`,
        color: 'red',
      })
    }
  }

  return (
    <>
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <p>Import an existing Git repository</p>
        <div>
          <Form>
            <Form.Group inline>
              <Form.Field
                fluid
                className={styles.urlInput}
                control={Input}
                data-cy="sync-field"
                name="url"
                placeholder={`e.g., ${remoteRepoPlaceHolder}`}
                value={form.url || ''}
                onChange={onChange}
              />
              <div className={styles.syncButton}>
                <Form.Field
                  color="green"
                  content="Sync"
                  control={Button}
                  disabled={loading || form.url == null}
                  icon="sync"
                  loading={loading}
                  onClick={handleClick}
                />
              </div>
            </Form.Group>
          </Form>
        </div>
        {!isEmpty(message) ? (
          <Message
            color={message.color}
            data-cy="sync-result-message"
            style={{ maxWidth: '70%' }}
          >
            {message.content}
          </Message>
        ) : null}
      </div>
      <SyncConflictModal
        conflictModalOpen={conflictModalOpen}
        projectName={projectName}
        onClose={() => {
          setUserOp(NoOp)
          // Close the modal
          setConflictModalOpen(false)
          // Clear input and error message.
          clear()
          setMessage({})
        }}
        onDifferentName={onDifferentName}
        onOverwrite={onOverwrite}
      />
    </>
  )
}

Sync.propTypes = {
  setUserOp: func.isRequired,
}

export default Sync
