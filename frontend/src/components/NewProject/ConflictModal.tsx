import React, { useContext, useEffect } from 'react'
import { Button, Form, Input, Modal } from 'semantic-ui-react'

import useForm from '@hooks/useForm'
import ExistingProjectFromModel from '@models/ExistingProjectForm'
import { isUsableProjectName } from '@utils/giteaApi'
import { formatAsGiteaRepoName } from '@utils/index'
import { AuthContext } from '@contexts/AuthContext'

const ConflictModal = ({
  conflictModalOpen,
  onClose,
  originalProjectName,
  message,
  onDifferentName,
  onDifferentNameButtonContent,
  onOverwrite,
  onOverwriteButtonContent,
}: BaseConflictModalProps) => {
  const { user } = useContext(AuthContext)
  const { form, onChange, isValid, populate, formatErrorPrompt } = useForm(
    ExistingProjectFromModel,
  )

  const [isValidProjectName, setIsValidProjectName] = React.useState(false)

  const didChangeName = originalProjectName !== form.name
  const projectName = formatAsGiteaRepoName(form.name || '')

  useEffect(() => {
    populate({ name: originalProjectName })
  }, [originalProjectName, populate])

  useEffect(() => {
    if (form.name && didChangeName) {
      isUsableProjectName(user.username, form.name, isValid).then(
        setIsValidProjectName,
      )
    }
  }, [user, form.name, isValid, didChangeName])

  return (
    <Modal
      closeIcon
      data-cy="collision-modal"
      open={conflictModalOpen}
      onClose={onClose}
    >
      <Modal.Header>A project with that name already exists.</Modal.Header>
      <Modal.Content>
        <p>{message}</p>
        <Form>
          <Form.Field
            fluid
            control={Input}
            error={formatProjectNameError(
              isValidProjectName,
              didChangeName,
              projectName,
              formatErrorPrompt('name'),
            )}
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
            content={onDifferentNameButtonContent}
            data-cy="collision-different-name"
            disabled={!isValidProjectName}
            onClick={() => onDifferentName(projectName)}
          />
        ) : (
          <Button
            color="orange"
            content={onOverwriteButtonContent}
            data-cy="collision-update"
            onClick={onOverwrite}
          />
        )}
      </Modal.Actions>
    </Modal>
  )
}

export const SyncConflictModal = ({
  conflictModalOpen,
  onClose,
  originalProjectName,
  onDifferentName,
  onOverwrite,
}: SyncConflictModalProps) => (
  <ConflictModal
    {...{
      conflictModalOpen,
      onClose,
      originalProjectName,
      onDifferentName,
      onOverwrite,
    }}
    message="You have an imported a project with the same name. You can either overwrite the existing project or choose a different name."
    onDifferentNameButtonContent="OK"
    onOverwriteButtonContent="Overwrite"
  />
)

export const UploadConflictModal = ({
  conflictModalOpen,
  onClose,
  onDifferentName,
  onOverwrite,
  originalProjectName,
}: SyncConflictModalProps) => (
  <ConflictModal
    {...{
      conflictModalOpen,
      onClose,
      originalProjectName,
      onDifferentName,
      onOverwrite,
    }}
    message="You have an existing project with the same name. You can either choose a different name or update this file in the existing project."
    onDifferentNameButtonContent="Choose a different name"
    onOverwriteButtonContent="Update existing project"
  />
)

/**
 * Disjoint form validation errors, e.g, maximum length, not empty, etc, with conflicting project name errors
 * @returns
 */
const formatProjectNameError = (
  isValidProjectName: boolean,
  didChangeName: boolean,
  projectName: string,
  formErrors?: { content: any; pointing: string },
) => {
  if (formErrors) {
    return formErrors
  }
  return !isValidProjectName && didChangeName
    ? {
        content: `A project named "${projectName}" already exists!`,
        pointing: 'below',
      }
    : null
}

interface SyncConflictModalProps {
  conflictModalOpen: boolean
  onClose: () => void
  onDifferentName: (name: string) => void
  onOverwrite: () => void
  originalProjectName: string
}

interface BaseConflictModalProps extends SyncConflictModalProps {
  message: string
  onDifferentNameButtonContent: string
  onOverwriteButtonContent: string
}
