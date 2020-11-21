import React, { useEffect, useState, useContext } from 'react'
import { useRouter } from 'next/router'
import Error from 'next/error'

import { Page } from '@/components/Page'
import DropZone from '@/components/DropZone'
import useForm from '@/hooks/useForm'
import { ProjectUploadForm } from '@/models/ProjectUploadForm'
import { UploadContext } from '@/contexts/UploadContext'
import { createRepo } from '@utils/giteaApi'
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
    const getRepo = async () => {
      const project = await getProject(fullname)
      setProject(project)
    }

    getRepo().then()
  }, [])

  return project != null ? (
    <Page>
      <div style={{ maxWidth: '70%', margin: 'auto' }}>
        <Header as="h2" textAlign="center">
          Updating {projectName} by {user}
        </Header>
        <UpdateForm name={project.name} description={project.description} />
      </div>
    </Page>
  ) : (
    // limit the rendering of this page for already existing repos
    <Error statusCode={404} />
  )
}

const UpdateForm = ({ name, description }) => {
  const { loadedFiles, uploadFile } = useContext(UploadContext)

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ProjectUploadForm,
  )
  const [message, setMessage] = useState({
    status: 'positive',
    body: '',
    header: '',
  })

  useEffect(() => {
    populate({ name, description })
  }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true)

    const repo = await createRepo(form.name, form.description, form._csrf)

    if (repo === '') {
      // empty repo name means that it failed to create the repo
      setMessage({
        status: 'negative',
        body: `You already have a project named ${form.name}!`,
        header: 'Oops!',
      })
      setDone(true)
      setLoading(false)
      // skip uploading as there's no repo, the upload is guaranteed to fail
      return
    }

    // there's a race condition happens on gitea when making several request to the upload endpoint
    // a hacky/awful solution to get around it is simulating a scheduler with setTimeout
    const delay = 1000
    await Promise.all(
      loadedFiles.map(async (file, idx) => {
        const reader = new FileReader()
        reader.onload = async () => {
          const path = file.name
          const content = reader.result
          setTimeout(async () => {
            const isSuccess = await uploadFile(repo, path, content, form._csrf)
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
        }
        reader.readAsBinaryString(file)
      }),
    )

    setLoading(false)
    setMessage({
      status: 'positive',
      body: 'All files have been uploaded successfully.',
      header: 'Success!',
    })
    setDone(true)
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
            content="Submit"
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

const getProject = async fullname => {
  const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
  const repoUrl = `${giteaApiUrl}/repos/${fullname}`

  const res = await fetch(repoUrl, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.ok ? await res.json() : null
}

export default UpdateProject
