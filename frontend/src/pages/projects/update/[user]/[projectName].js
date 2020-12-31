import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'

import { Page } from '@components/Page'
import DropZone from '@components/DropZone'
import FilesPreview from '@components/FilesPreview'
import useForm from '@hooks/useForm'
import { ProjectUpdateForm } from '@models/ProjectUpdateForm'
import { UploadContext } from '@contexts/UploadContext'
import { getRepo, updateRepo } from '@utils/giteaApi'
import {
  Button,
  Form,
  Header,
  Input,
  Message,
  Segment,
  TextArea,
} from 'semantic-ui-react'

const UpdateProject = () => {
  const router = useRouter()
  const { user, projectName, create } = router.query
  const { setPersistenceScope } = useContext(UploadContext)
  const [project, setProject] = useState({})
  const [isSynced, setIsSynced] = useState(false)

  const fullname = `${user}/${projectName}`

  useEffect(() => {
    setPersistenceScope(projectName)
    getRepo(fullname).then(setProject)
  }, [])

  useEffect(() => {
    setIsSynced(project.mirror)
  }, [project])

  return (
    <Page>
      <div style={{ maxWidth: '70%', margin: 'auto' }}>
        {isSynced ? (
          <Message color="yellow">
            <Message.Header>A mirrored repository</Message.Header>
            <Message.Content>
              Files upload isn't supported for synced repositories. Please commit
              files to the original git repository and it will be synced
              automatically.
            </Message.Content>
          </Message>
        ) : null}
        <Header as="h2" textAlign="center">
          Updating {projectName} by {user}
        </Header>
        <UpdateForm
          isNew={create === 'true'}
          withDropZone={!isSynced}
          owner={user}
          name={projectName}
          description={project?.description}
        />
      </div>
    </Page>
  )
}

const UpdateForm = ({ isNew, withDropZone, owner, name, description }) => {
  const fullname = `${owner}/${name}`

  const { allFiles, loadedFiles, uploadLoadedFiles, loadFiles } = useContext(
    UploadContext,
  )
  const { push } = useRouter()
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUpdateForm,
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    populate({ name, description }, form.name == null || form.description == null)
  }, [allFiles])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)

    if (loadedFiles?.length) {
      await uploadLoadedFiles(fullname)
    }

    const updatedSuccessfully = await updateRepo(
      fullname,
      { name: form.name, description: form.description },
      form._csrf,
    )

    if (updatedSuccessfully) {
      await push(`/projects/update/${owner}/${form.name}`)
    }
  }

  const onDrop = async files => {
    loadFiles(files, name)
  }

  return (
    <>
      <Form>
        <Segment>
          {withDropZone ? <DropZone onDrop={onDrop} /> : null}
          <FilesPreview />
          <Form.Field
            fluid
            required
            control={Input}
            label="Project name"
            placeholder="Project name"
            name="name"
            value={form.name || ''}
            onChange={onChange}
            error={formatErrorPrompt('name')}
          />
          <Form.Field
            control={TextArea}
            label="Project description"
            placeholder="Project description"
            name="description"
            value={form.description || ''}
            onChange={onChange}
            error={formatErrorPrompt('description')}
          />
          <Form.Field
            fluid
            control={Button}
            content={isNew ? 'Create' : 'Update'}
            disabled={!isValid || loading}
            onClick={submit}
            positive
            loading={loading}
          />
        </Segment>
      </Form>
    </>
  )
}

export default UpdateProject
