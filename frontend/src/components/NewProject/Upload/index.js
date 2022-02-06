import React, { useState, useEffect, useCallback } from 'react'
import { bool, func, number, shape, string } from 'prop-types'
import { Input, Button, Modal, Form, Loader } from 'semantic-ui-react'

import slugify from 'slugify'
import { useRouter } from 'next/router'

import DropZone from '@components/DropZone'
import { commitInitialFiles } from '@utils/giteaInternalApi'
import { createRepo, repoExists } from '@utils/giteaApi'
import { slugifiedNameFromFiles } from '@utils/index'
import useForm from '@hooks/useForm'
import ExistingProjectFromModel from '@models/ExistingProjectForm'

const Upload = ({ user, csrf }) => {
  const { push } = useRouter()
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ExistingProjectFromModel,
  )

  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [originalProjectName, setOriginalProjectName] = useState('')
  const [isValidProjectName, setIsValidProjectName] = useState(false)
  const [failedToCreateProject, setFailedToCreateProject] = useState(false)

  const onDrop = async droppedFiles => {
    const tempProjectName = slugifiedNameFromFiles(droppedFiles)
    const repo = await createRepo(tempProjectName, '', csrf)

    setProjectName(tempProjectName)
    setOriginalProjectName(tempProjectName)
    setDroppedFiles(droppedFiles)

    if (repo === '') {
      // In the case of failing to create the repo, i.e., it already exits.
      setConflictModalOpen(true)
      setFailedToCreateProject(true)
      console.error('Project already exists!')
    } else {
      // Commit files to gitea server on drop
      const didUploadSuccessfully = await commitInitialFiles({
        files: droppedFiles,
        repo: `${user.username}/${tempProjectName}`,
        csrf,
      })

      if (didUploadSuccessfully) {
        await push(`/${user.username}/${tempProjectName}?create=true`)
      } else {
        setFailedToCreateProject(!didUploadSuccessfully)
      }
    }
  }

  const onDifferentName = async () => {
    // create repo with the new name and redirect to the update page which will have the loaded files
    const differentName = slugify(form.name)
    setProjectName(differentName)
    await createRepo(differentName, '', csrf)

    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${differentName}`,
      csrf,
    })
    await push(`/${user.username}/${differentName}?create=true`)
  }

  const onUpdateExisting = async () => {
    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${projectName}`,
      csrf,
    })
    await push(`/${user.username}/${projectName}`)
  }

  const validateProjectName = useCallback(async () => {
    // Check if the new name will also cause a conflict.
    const repoFullname = `${user.username}/${form.name}`

    if (!(await repoExists(repoFullname))) {
      setIsValidProjectName(isValid)
    } else {
      setIsValidProjectName(false)
    }
  }, [user, form, isValid])

  const formatProjectNameError = () => {
    // disjoint form validation errors, e.g, maximum length, not empty, etc, with conflicting project name errors
    const formErrors = formatErrorPrompt('name')

    if (formErrors) {
      return formErrors
    }
    return !isValidProjectName
      ? {
          content: `A project named "${form.name}" already exists!`,
          pointing: 'below',
        }
      : null
  }

  useEffect(() => {
    populate({ name: projectName }, true)
  }, [projectName, populate])

  useEffect(() => {
    if (form.name) {
      validateProjectName()
    }
  }, [form.name, validateProjectName])

  const didChangeName = originalProjectName !== form.name

  return (
    <>
      <NewProjectDropZone
        didDropFiles={droppedFiles.length !== 0}
        failedToCreateProject={failedToCreateProject}
        onDrop={onDrop}
      />
      <Modal
        closeIcon
        data-cy="collision-modal"
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
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
              error={formatProjectNameError()}
              label={didChangeName ? 'New project name' : 'Project name'}
              name="name"
              value={form.name || ''}
              onChange={onChange}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          {didChangeName ? (
            <Button
              color="green"
              content="OK"
              data-cy="collision-different-name"
              disabled={!isValidProjectName}
              onClick={onDifferentName}
            />
          ) : (
            <Button
              color="orange"
              content={`Add files to "${originalProjectName}"`}
              data-cy="collision-update"
              onClick={onUpdateExisting}
            />
          )}
        </Modal.Actions>
      </Modal>
    </>
  )
}

const NewProjectDropZone = ({ onDrop, didDropFiles, failedToCreateProject }) => {
  if (didDropFiles && !failedToCreateProject)
    return (
      <Loader active data-cy="creating-project-loader">
        Creating Project...
      </Loader>
    )
  return (
    <DropZone overrideStyle={{ maxWidth: '70%', margin: 'auto' }} onDrop={onDrop} />
  )
}

Upload.propTypes = {
  user: shape({ username: string, id: number }),
  csrf: string.isRequired,
}

NewProjectDropZone.propTypes = {
  onDrop: func.isRequired,
  didDropFiles: bool.isRequired,
  failedToCreateProject: bool.isRequired,
}

export default Upload
