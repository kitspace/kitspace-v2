import React, { useContext, useEffect } from 'react'
import { Button, Form, Input, Modal } from 'semantic-ui-react'

import UseForm from '@hooks/useForm'
import ExistingProjectFromModel from '@models/ExistingProjectForm'
import { isUsableProjectName, repoExists } from '@utils/giteaApi'
import { formatAsGiteaRepoName } from '@utils/index'
import { AuthContext } from '@contexts/AuthContext'

export const SyncConflictModal = ({
  conflictModalOpen,
  onClose,
  projectName,
  onDifferentName,
  onOverwrite,
}: SyncConflictModalProps) => {
  const { user } = useContext(AuthContext)
  const { form, onChange, isValid, populate } = UseForm(ExistingProjectFromModel)

  const [isValidProjectName, setIsValidProjectName] = React.useState(false)

  const didChangeName = projectName !== form.name
  const repoName = formatAsGiteaRepoName(form.name || '')

  useEffect(() => {
    populate({ name: projectName })
  }, [projectName, populate])

  useEffect(() => {
    if (form.name) {
      isUsableProjectName(user.username, form.name, isValid).then(
        setIsValidProjectName,
      )
    }
  }, [user, form.name, isValid])

  return (
    <Modal
      closeIcon
      data-cy="collision-modal"
      open={conflictModalOpen}
      onClose={onClose}
    >
      <Modal.Header>Heads up!</Modal.Header>
      <Modal.Content>
        <p>
          You have an imported a project with the same name. You can either
          overwrite the existing project or choose a different name.
        </p>
        <Form>
          <Form.Field
            fluid
            control={Input}
            // error={}
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
            onClick={() => onDifferentName(repoName)}
          />
        ) : (
          <Button
            color="orange"
            content="Overwrite"
            data-cy="collision-update"
            onClick={onOverwrite}
          />
        )}
      </Modal.Actions>
    </Modal>
  )
}

interface SyncConflictModalProps {
  conflictModalOpen: boolean
  onClose: () => void
  projectName: string
  onDifferentName: (name: string) => void
  onOverwrite: () => void
}
