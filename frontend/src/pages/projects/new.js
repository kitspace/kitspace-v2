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
import DropZone from '../../components/DropZone'
import { AuthContext } from '@contexts/AuthContext'
import { UploadContext } from '@contexts/UploadContext'
import { createRepo, getRepo, migrateRepo, urlToName } from '@utils/giteaApi'
import { slugifiedNameFromFiles } from '@utils/index'
import useForm from '../../hooks/useForm'
import { ExistingProjectFrom } from '@models/ExistingProjectForm'
import { SyncRepoFrom } from '@models/SyncRepoForm'

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
  const { loadFiles } = useContext(UploadContext)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ExistingProjectFrom,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [files, setFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [isValidProjectName, setIsValidProjectName] = useState(false)

  useEffect(() => {
    populate({ name: projectName }, true)
  }, [projectName])

  useEffect(() => {
    if (form.name) {
      validateProjectName().then()
    }
  }, [form.name])

  const onDrop = async files => {
    const tempProjectName = slugifiedNameFromFiles(files)
    const repo = await createRepo(tempProjectName, '', csrf)

    setProjectName(tempProjectName)
    setFiles(files)

    // In the case of failing to create the repo, i.e., it already exits.
    if (repo === '') {
      setModalOpen(true)
      console.error('Project already exists!')
    } else {
      loadFiles(files, tempProjectName)
      await push(`/projects/update/${user.login}/${tempProjectName}?create=true`)
    }
  }

  const onDifferentName = async () => {
    // create repo with the new name and redirect to the update page which will have the loaded files
    const differentName = slugify(form.name)
    setProjectName(differentName)
    await createRepo(differentName, '', csrf)

    loadFiles(files, differentName)
    await push(`/projects/update/${user.login}/${differentName}?create=true`)
  }

  const onUpdateExisting = async () => {
    loadFiles(files, projectName)
    await push(`/projects/update/${user.login}/${projectName}`)
  }

  const validateProjectName = async () => {
    // Check if the new name will also cause a conflict.
    const project = await getRepo(`${user.login}/${form.name}`)

    if (project == null) {
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
      <Modal closeIcon open={modalOpen} onClose={() => setModalOpen(false)}>
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
            content="Choose different name"
            color="green"
            disabled={!isValidProjectName}
            onClick={onDifferentName}
          />
          <Button
            content="Update existing project"
            color="yellow"
            onClick={onUpdateExisting}
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
  const username = user?.login

  const handleClick = async () => {
    if (isEmpty(errors)) {
      setLoading(true)
      setMessage({
        content: 'Processing the repository, this may take a while...',
        color: 'green',
      })

      const repoURL = form.url
      const repoName = urlToName(repoURL)

      const res = await migrateRepo(repoURL, uid, csrf)
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p>Sync an existing Git repository</p>
      <div style={{ margin: 'auto', display: 'flex' }}>
        <Form>
          <Form.Group>
            {!isEmpty(message) ? (
              <Message color={message.color}>{message.content}</Message>
            ) : null}
          </Form.Group>
          <Form.Group inline>
            <Form.Field
              fluid
              control={Input}
              className={styles.urlInput}
              name="url"
              placeholder={remoteRepoPlaceHolder}
              onChange={onChange}
              value={form.url || ''}
            />
            <div className={styles.syncButton}>
              <Form.Field
                control={Button}
                content="Sync"
                color="green"
                loading={loading}
                disabled={loading}
                onClick={handleClick}
                icon="sync"
              />
            </div>
          </Form.Group>
        </Form>
      </div>
    </div>
  )
}

export default New
