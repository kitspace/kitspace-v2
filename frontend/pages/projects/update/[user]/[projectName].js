import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'

import { Page } from '@/components/Page'
import DropZone from '@/components/DropZone'
import FilesPreview from '@/components/FilesPreview'
import useForm from '@/hooks/useForm'
import { ProjectUpdateForm } from '@/models/ProjectUpdateForm'
import { UploadContext } from '@/contexts/UploadContext'
import { getRepo, updateRepo } from '@utils/giteaApi'
import { Button, Form, Header, Input, Segment, TextArea } from 'semantic-ui-react'

const UpdateProject = () => {
  const router = useRouter()
  const { user, projectName, create } = router.query
  const { setPersistenceScope } = useContext(UploadContext)
  const [project, setProject] = useState({})

  const fullname = `${user}/${projectName}`

  useEffect(() => {
    const getProject = async () => {
      const project = await getRepo(fullname)
      setProject(project)
    }
    setPersistenceScope(projectName)
    getProject().then()
  }, [])

  return (
    <Page>
      <div style={{ maxWidth: '70%', margin: 'auto' }}>
        <Header as="h2" textAlign="center">
          Updating {projectName} by {user}
        </Header>
        <UpdateForm
          isNew={create === 'true'}
          owner={user}
          name={projectName}
          description={project?.description}
        />
      </div>
    </Page>
  )
}

const UpdateForm = ({ isNew, owner, name, description }) => {
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
          <DropZone onDrop={onDrop} />
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
