import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Error from 'next/error'

import { Page } from '@/components/Page'
import DropZone from '@/components/DropZone'
import FilesPreview from '@/components/FilesPreview'
import useForm from '@/hooks/useForm'
import { ProjectUploadForm } from '@/models/ProjectUploadForm'
import { UploadContext } from '@/contexts/UploadContext'
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
  const { user, projectName } = router.query
  const [project, setProject] = useState({})

  const fullname = `${user}/${projectName}`

  useEffect(() => {
    const getProject = async () => {
      const project = await getRepo(fullname)
      setProject(project)
    }

    getProject().then()
  }, [])

  return project != null ? (
    <Page>
      <div style={{ maxWidth: '70%', margin: 'auto' }}>
        <Header as="h2" textAlign="center">
          Updating {projectName} by {user}
        </Header>
        <UpdateForm
          owner={user}
          name={project.name}
          description={project.description}
        />
      </div>
    </Page>
  ) : (
    // limit the rendering of this page for already existing repos
    <Error statusCode={404} />
  )
}

const UpdateForm = ({ owner, name, description }) => {
  const fullname = `${owner}/${name}`

  const { allFiles, loadedFiles, uploadFile } = useContext(UploadContext)
  const { push } = useRouter()
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUploadForm,
  )
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [message, setMessage] = useState({
    status: 'positive',
    body: '',
    header: '',
  })

  useEffect(() => {
    populate({ name, description }, form.name == null)
  }, [allFiles])

  const uploadLoadedFiles = async repo => {
    // there's a race condition happens on gitea when making several request to the upload endpoint
    // a hacky/awful solution to get around it is simulating a scheduler with setTimeout
    const delay = 1000
    const res = await Promise.all(
      loadedFiles.map(async (file, idx) => {
        const content = sessionStorage.getItem(`loadedFile_${file.name}`)
        console.log({ file, idx, content })
        setTimeout(async () => {
          const isSuccess = await uploadFile(repo, file.name, content, form._csrf)
          if (!isSuccess) {
            setMessage({
              status: 'negative',
              body: 'Something went wrong! Please, try again later.',
              header: 'Oops!',
            })
            setDone(true)
          }
          return isSuccess
        }, delay * idx)
      }),
    )

    console.log(res)
  }

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

  return (
    <>
      <Message
        positive={message.status === 'positive'}
        negative={message.status === 'negative'}
        style={{
          display: done && !loading ? 'block' : 'none',
        }}
      >
        <Message.Header>{message.header}</Message.Header>
        {message.body}
      </Message>
      <Form>
        <Segment>
          <DropZone />
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
            required
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
            content="Update"
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
