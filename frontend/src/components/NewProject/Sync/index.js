import React, { useState } from 'react'
import { number, shape, string } from 'prop-types'
import { Input, Button, Form, Message } from 'semantic-ui-react'

import { useRouter } from 'next/router'
import { isEmpty } from 'lodash'

import SyncRepoFromModel from '@models/SyncRepoForm'
import useForm from '@hooks/useForm'
import { mirrorRepo } from '@utils/giteaApi'
import { urlToName } from '@utils/index'
import styles from './index.module.scss'

const Sync = ({ user, csrf }) => {
  const { push } = useRouter()
  const { form, errors, onChange } = useForm(SyncRepoFromModel)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({})

  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'

  const uid = user?.id
  const username = user?.username

  const handleClick = async () => {
    if (isEmpty(errors)) {
      setLoading(true)
      setMessage({
        content: 'Processing the repository, this may take a while...',
        color: 'green',
      })

      const repoURL = form.url
      const repoName = urlToName(repoURL)

      const res = await mirrorRepo(repoURL, uid, csrf)
      const migrateSuccessfully = res.ok
      const alreadySynced = res.status === 409

      if (migrateSuccessfully) {
        setMessage({
          content: 'Migrated successfully, redirecting the project page...',
          color: 'green',
        })
        await push(`/${username}/${repoName}`)
      } else {
        if (alreadySynced) {
          setMessage({
            content: 'Repository is already synced!',
            color: 'red',
          })
        } else {
          setMessage({
            content: `Something went wrong. Are you sure "${form.url}" is a valid git repository?`,
            color: 'red',
          })
        }

        setLoading(false)
      }
    } else {
      setMessage({
        content: `Please, enter a valid URL to a remote git repo e.g., ${remoteRepoPlaceHolder}`,
        color: 'yellow',
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p>Sync an existing Git repository</p>
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
  )
}

Sync.propTypes = {
  user: shape({ username: string, id: number }),
  csrf: string.isRequired,
}

export default Sync
