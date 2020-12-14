import React, { useState, useContext, useEffect } from 'react'
import { Grid, Divider, Input, Button, Modal, Form } from 'semantic-ui-react'

import styles from './new.module.scss'
import { Page } from '@/components/Page'
import DropZone from '@/components/DropZone'
import { AuthContext } from '@/contexts/AuthContext'
import { UploadContext } from '@/contexts/UploadContext'
import { createRepo, migrateRepo, urlToName } from '@utils/giteaApi'
import { useRouter } from 'next/router'
import { slugifiedNameFromFiles } from '@utils/index'
import useForm from '@/hooks/useForm'
import { ExistingProjectFrom } from '@/models/ExistingProjectForm'

const New = () => {
  const { csrf, user } = useContext(AuthContext)
  return (
    <Page title="new" reqSignIn>
      <div
        className={`${styles.projectsNew} ui two column stackable center aligned grid`}
      >
        <Grid.Row>
          <Grid.Column className={styles.optionColumn}>
            <Sync csrf={csrf} user={user} />
          </Grid.Column>
          <Divider className={styles.divider} vertical>
            Or
          </Divider>
          <Grid.Column className={styles.optionColumn}>
            <Upload csrf={csrf} user={user} />
          </Grid.Column>
        </Grid.Row>
      </div>
    </Page>
  )
}

const Upload = ({ user, csrf }) => {
  const { push } = useRouter()
  const { loadFiles } = useContext(UploadContext)
  const {form, onChange, populate, isValid} = useForm(ExistingProjectFrom)

  const [open, setOpen] = useState(false)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    populate({ name: projectName }, true)
  }, [projectName])

  const onDrop = async files => {
    const tempProjectName = slugifiedNameFromFiles(files)
    const repo = await createRepo(tempProjectName, '', csrf)

    setProjectName(tempProjectName)

    // In the case of failing to create the repo, i.e., it already exits.
    if (repo === '') {
      setOpen(true)
      console.error('Repo already exists!')
    } else {
      loadFiles(files, tempProjectName)
      await push(`/projects/update/${user.login}/${tempProjectName}?create=true`)
    }
  }

  const isValidProjectName = () => {
    // should check if the new name is will also cause a conflict.
    return isValid
  }

  return (
    <>
      <DropZone onDrop={onDrop} />
      <Modal closeIcon open={open} onClose={() => setOpen(false)}>
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
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button content="Choose different name" color="yellow" disabled={!isValidProjectName} />
          <Button content="Update existing project" color="green" />
        </Modal.Actions>
      </Modal>
    </>
  )
}

const Sync = ({ user, csrf }) => {
  const { push } = useRouter()
  const [loading, setLoading] = useState(false)

  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'
  const [remoteRepo, setRemoteRepo] = useState('')

  const uid = user.id
  const username = user.login

  const handleClick = async () => {
    setLoading(true)
    const repo = remoteRepo || remoteRepoPlaceHolder
    const migrateSuccessfully = await migrateRepo(repo, uid, csrf)

    if (migrateSuccessfully) {
      const repoName = urlToName(repo)
      setLoading(false)
      await push(`/projects/update/${username}/${repoName}`)
    }
  }

  return (
    <div>
      <p>Sync an existing Git repository</p>
      <div className={styles.syncSide}>
        <Input
          className={styles.urlInput}
          fluid
          onChange={e => setRemoteRepo(e.target.value)}
          placeholder={remoteRepoPlaceHolder}
          value={remoteRepo}
        />
        <div className={styles.syncButton}>
          <Button
            color="green"
            onClick={handleClick}
            loading={loading}
            disabled={loading}
          >
            Sync
          </Button>
        </div>
      </div>
    </div>
  )
}

export default New
