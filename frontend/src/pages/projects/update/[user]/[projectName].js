import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import { Page } from '@components/Page'
import FilesPreview from '@components/FilesPreview'
import useForm from '@hooks/useForm'
import { ProjectUpdateForm } from '@models/ProjectUpdateForm'
import { UploadContext } from '@contexts/UploadContext'
import { useRepo, updateRepo } from '@utils/giteaApi'
import {
  Button,
  Form,
  Header,
  Input,
  Loader,
  Message,
  Segment,
  TextArea,
} from 'semantic-ui-react'

const DropZone = dynamic(() => import('@components/DropZone'))

const UpdateProject = () => {
  const router = useRouter()
  const { user, projectName, create } = router.query
  const { setPersistenceScope } = useContext(UploadContext)
  const [isSynced, setIsSynced] = useState(false)

  const fullName = `${user}/${projectName}`

  const { project, isLoading } = useUpdateFrom(fullName)

  useEffect(() => {
    setPersistenceScope(projectName)
    setIsSynced(project?.mirror)
  }, [project])

  if (isLoading) {
    return (
      <Page>
        <Loader active />
      </Page>
    )
  }

  return (
    <Page>
      <div style={{ maxWidth: '70%', margin: 'auto' }}>
        {isSynced ? (
          <Message color="yellow">
            <Message.Header>A synced repository!</Message.Header>
            <Message.Content>
              <p>Files uploading isn't supported for synced repositories.</p>
              Please commit files to the original git repository and it will be
              synced automatically.
            </Message.Content>
          </Message>
        ) : null}
        <Header as="h2" textAlign="center">
          Updating {projectName} by {user}
        </Header>
        <UpdateForm
          isNew={create === 'true'}
          previewOnly={isSynced}
          owner={user}
          name={projectName}
          description={project?.description}
        />
      </div>
    </Page>
  )
}

const UpdateForm = ({ isNew, previewOnly, owner, name, description }) => {
  const fullname = `${owner}/${name}`

  const {
    allFiles,
    loadedFiles,
    uploadLoadedFiles,
    loadFiles,
    invalidateCache,
  } = useContext(UploadContext)

  const [loading, setLoading] = useState(false)
  const { push } = useRouter()
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUpdateForm,
  )

  useEffect(() => {
    populate({ name, description }, true)
    invalidateCache()
  }, [allFiles, name, description])

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
          {!previewOnly ? <DropZone onDrop={onDrop} /> : null}
          <FilesPreview />
        </Segment>
        <Segment>
          <Form.Field
            fluid
            required
            readOnly={previewOnly}
            control={Input}
            label="Project name"
            placeholder="Project name"
            name="name"
            value={form.name || ''}
            onChange={onChange}
            error={formatErrorPrompt('name')}
          />
          <Form.Field
            readOnly={previewOnly}
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
            disabled={previewOnly || !isValid || loading}
            onClick={submit}
            positive
            loading={loading}
          />
        </Segment>
      </Form>
    </>
  )
}

const useUpdateFrom = projectName => {
  const { repo, error } = useRepo(projectName)

  return {
    project: repo,
    isLoading: !(error || repo),
    isError: error,
  }
}

export default UpdateProject
