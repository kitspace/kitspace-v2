import React, { useState, useContext, useEffect } from 'react'
import {
  Grid,
  Divider,
  Input,
  Button,
  Modal,
  Form,
  Message,
} from 'semantic-ui-react'

import slugify from 'slugify'
import { useRouter } from 'next/router'
import { isEmpty } from 'lodash'
import { useMediaPredicate } from 'react-media-hook'

import styles from './new.module.scss'
import { Page } from '@components/Page'
import DropZone from '@components/DropZone'
import { AuthContext } from '@contexts/AuthContext'
import { commitFiles } from '@utils/giteaInternalApi'
import { createRepo, repoExists, mirrorRepo } from '@utils/giteaApi'
import { slugifiedNameFromFiles, urlToName } from '@utils/index'
import useForm from '@hooks/useForm'
import { ExistingProjectFrom } from '@models/ExistingProjectForm'
import { SyncRepoFrom } from '@models/SyncRepoForm'

// Explicitly mark as static.
// Due to using `getInitialProps` in `_app.js` pages that can be statically built aren't.
export const getStaticProps = () => {
  return {
    props: {},
  }
}

const New = () => {
  const { csrf, user } = useContext(AuthContext)
  const isBigScreen = useMediaPredicate('(min-width: 1200px)')
  const rowStyle = { paddingBottom: '10%', paddingTop: '10%' }

  return (
    <Page title="new" reqSignIn>
      {isBigScreen ? (
        <div
          className={`${styles.projectsNew} ui two column stackable center aligned grid`}
        >
          <Grid.Row>
            <Grid.Column className={styles.optionColumn}>
              <Sync csrf={csrf} user={user} inline />
            </Grid.Column>
            <Divider className={styles.divider} vertical>
              Or
            </Divider>
            <Grid.Column className={styles.optionColumn}>
              <Upload csrf={csrf} user={user} />
            </Grid.Column>
          </Grid.Row>
        </div>
      ) : (
        <div className={`${styles.projectsNew} ui one column  center aligned grid`}>
          <Grid.Column>
            <Grid.Row style={rowStyle}>
              <Sync csrf={csrf} user={user} />
            </Grid.Row>
            <Divider className={styles.divider} horizontal>
              Or
            </Divider>
            <Grid.Row style={rowStyle}>
              <Upload csrf={csrf} user={user} />
            </Grid.Row>
          </Grid.Column>
        </div>
      )}
    </Page>
  )
}

const Upload = ({ user, csrf }) => {
  const { push } = useRouter()
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ExistingProjectFrom,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [originalProjectName, setOriginalProjectName] = useState('')
  const [isValidProjectName, setIsValidProjectName] = useState(false)

  useEffect(() => {
    populate({ name: projectName }, true)
  }, [projectName])

  useEffect(() => {
    if (form.name) {
      // noinspection JSIgnoredPromiseFromCall
      validateProjectName()
    }
  }, [form.name])

  const onDrop = async files => {
    const tempProjectName = slugifiedNameFromFiles(files)
    const repo = await createRepo(tempProjectName, '', csrf)

    setProjectName(tempProjectName)
    setOriginalProjectName(tempProjectName)
    setFiles(files)

    if (repo === '') {
      // In the case of failing to create the repo, i.e., it already exits.
      setModalOpen(true)
      console.error('Project already exists!')
    } else {
      // Commit files to gitea server on drop
      await commitFiles({
        files,
        repo: `${user.username}/${tempProjectName}`,
        csrf,
      })
      await push(`/projects/update/${user.username}/${tempProjectName}?create=true`)
    }
  }

  const onDifferentName = async () => {
    // create repo with the new name and redirect to the update page which will have the loaded files
    const differentName = slugify(form.name)
    setProjectName(differentName)
    await createRepo(differentName, '', csrf)

    await commitFiles({ files, repo: `${user.username}/${differentName}`, csrf })
    await push(`/projects/update/${user.username}/${differentName}?create=true`)
  }

  const onUpdateExisting = async () => {
    await commitFiles({ files, repo: `${user.username}/${projectName}`, csrf })
    await push(`/projects/update/${user.username}/${projectName}`)
  }

  const validateProjectName = async () => {
    // Check if the new name will also cause a conflict.
    const repoFullname = `${user.username}/${form.name}`

    if (!(await repoExists(repoFullname))) {
      setIsValidProjectName(isValid)
    } else {
      setIsValidProjectName(false)
    }
  }

  const formatProjectNameError = () => {
    // disjoint form validation errors, e.g, maximum length, not empty, etc, with conflicting project name errors
    const formErrors = formatErrorPrompt('name')

    if (formErrors) {
      return formErrors
    } else {
      return !isValidProjectName
        ? {
            content: `A project named "${form.name}" already exists!`,
            pointing: 'below',
          }
        : null
    }
  }

  return (
    <>
      <DropZone onDrop={onDrop} style={{ maxWidth: '70%', margin: 'auto' }} />
      <Modal
        data-cy="collision-modal"
        closeIcon
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Modal.Header>Heads up!</Modal.Header>
        <Modal.Content>
          <p>
            You have an existing project with the same name. You can either choose a
            different name or update this file in the existing project.
          </p>
          <Form>
            <Form.Field
              fluid
              control={Input}
              label="Project name"
              name="name"
              value={form.name || ''}
              onChange={onChange}
              error={formatProjectNameError()}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button
            data-cy="collision-different-name"
            content="Choose different name"
            color="green"
            disabled={!isValidProjectName}
            onClick={onDifferentName}
          />
          <Button
            data-cy="collision-update"
            content="Update existing project"
            color="yellow"
            onClick={onUpdateExisting}
            // When the modal pops if they change the project name, disable the `Update existing project` button
            disabled={originalProjectName !== form.name}
          />
        </Modal.Actions>
      </Modal>
    </>
  )
}

const Sync = ({ user, csrf }) => {
  const { push } = useRouter()
  const { form, errors, onChange } = useForm(SyncRepoFrom)

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
        await push(`/projects/update/${username}/${repoName}`)
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
              control={Input}
              className={styles.urlInput}
              name="url"
              placeholder={`e.g., ${remoteRepoPlaceHolder}`}
              onChange={onChange}
              value={form.url || ''}
            />
            <div className={styles.syncButton}>
              <Form.Field
                control={Button}
                content="Sync"
                color="green"
                loading={loading}
                disabled={loading || form.url == null}
                onClick={handleClick}
                icon="sync"
              />
            </div>
          </Form.Group>
        </Form>
      </div>
      {!isEmpty(message) ? (
        <Message style={{ maxWidth: '70%' }} color={message.color}>
          {message.content}
        </Message>
      ) : null}
    </div>
  )
}

export default New
