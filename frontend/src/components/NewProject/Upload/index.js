import React, { useState, useEffect, useCallback, useContext } from 'react'
import { bool, func, number } from 'prop-types'
import { Input, Button, Modal, Form, Loader, Progress } from 'semantic-ui-react'

import slugify from 'slugify'
import { useRouter } from 'next/router'

import { AuthContext } from '@contexts/AuthContext'
import { commitInitialFiles } from '@utils/giteaInternalApi'
import { createRepo, repoExists } from '@utils/giteaApi'
import { slugifiedNameFromFiles } from '@utils/index'
import { UploadOp, NoOp } from '../Ops'
import DropZone from '@components/DropZone'
import ExistingProjectFromModel from '@models/ExistingProjectForm'
import styles from './index.module.scss'
import useForm from '@hooks/useForm'

const Upload = ({ setUserOp }) => {
  const { push } = useRouter()
  const { user, csrf, apiToken } = useContext(AuthContext)
  const { form, onChange, populate, isValid, formatErrorPrompt } = useForm(
    ExistingProjectFromModel,
  )

  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState([])
  const [projectName, setProjectName] = useState('')
  const [originalProjectName, setOriginalProjectName] = useState('')
  const [isValidProjectName, setIsValidProjectName] = useState(false)
  const [isNewProject, setIsNewProject] = useState(true)
  const [progress, setProgress] = useState(0)

  const onDrop = async droppedFiles => {
    setUserOp(UploadOp)

    const tempProjectName = slugifiedNameFromFiles(droppedFiles)
    const repo = await createRepo(tempProjectName, '', csrf, apiToken)

    setProjectName(tempProjectName)
    setOriginalProjectName(tempProjectName)
    setDroppedFiles(droppedFiles)

    if (repo === '') {
      // In the case of failing to create the repo, i.e., it already exits.
      setConflictModalOpen(true)
      console.error('Project already exists!')
    } else {
      // Commit files to gitea server on drop
      const didUploadSuccessfully = await commitInitialFiles({
        files: droppedFiles,
        repo: `${user.username}/${tempProjectName}`,
        csrf,
        onProgress: setProgress,
      })

      if (didUploadSuccessfully) {
        await push(`/${user.username}/${tempProjectName}`)
      } else {
        console.error('Failed to upload files')
      }
    }
  }

  const onDifferentName = async () => {
    // create repo with the new name and redirect to the update page which will have the loaded files
    const differentName = slugify(form.name)
    setProjectName(differentName)
    await createRepo(differentName, '', csrf)

    // Close the conflict modal to show uploading progress.
    setConflictModalOpen(false)

    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${differentName}`,
      csrf,
      onProgress: setProgress,
    })
    await push(`/${user.username}/${differentName}`)
  }

  const onUpdateToExisting = async () => {
    setIsNewProject(false)
    // Close the conflict modal to show uploading progress.
    setConflictModalOpen(false)

    await commitInitialFiles({
      files: droppedFiles,
      repo: `${user.username}/${projectName}`,
      csrf,
      onProgress: setProgress,
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
      <Uploader
        isNewProject={isNewProject}
        progressValue={progress}
        totalNumberOfFiles={droppedFiles.length}
        onDrop={onDrop}
      />
      <Modal
        closeIcon
        data-cy="collision-modal"
        open={conflictModalOpen}
        onClose={() => {
          setUserOp(NoOp)
          // Close the modal
          setConflictModalOpen(false)
          // reset the state as if the user didn't drop anything
          setDroppedFiles([])
        }}
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
              onClick={onUpdateToExisting}
            />
          )}
        </Modal.Actions>
      </Modal>
    </>
  )
}

const Uploader = ({ isNewProject, onDrop, totalNumberOfFiles, progressValue }) => {
  const didDropFiles = totalNumberOfFiles !== 0
  const didStartUploading = didDropFiles && progressValue > 0
  const didFinishUploading = didDropFiles && progressValue === totalNumberOfFiles

  if (didStartUploading) {
    return (
      <Progress
        active={!didFinishUploading}
        className={styles.progressBar}
        color={didFinishUploading ? 'green' : 'blue'}
        label={
          totalNumberOfFiles === progressValue
            ? 'Initializing the project...'
            : 'Uploading files...'
        }
        progress="ratio"
        total={totalNumberOfFiles}
        value={progressValue}
      />
    )
  } else if (didDropFiles && isNewProject) {
    return (
      <Loader active data-cy="creating-project-loader">
        Creating Project...
      </Loader>
    )
  }

  return (
    <DropZone overrideStyle={{ maxWidth: '70%', margin: 'auto' }} onDrop={onDrop} />
  )
}

Upload.propTypes = {
  setUserOp: func.isRequired,
}

Uploader.propTypes = {
  isNewProject: bool.isRequired,
  onDrop: func.isRequired,
  totalNumberOfFiles: number.isRequired,
  progressValue: number.isRequired,
}

export default Upload
