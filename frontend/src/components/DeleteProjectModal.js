import React, { useContext } from 'react'
import { func, string } from 'prop-types'

import { Button, Modal } from 'semantic-ui-react'
import { deleteRepo } from '@utils/giteaApi'
import { AuthContext } from '@contexts/AuthContext'

const DeleteModal = ({ projectName, invalidateCache }) => {
  const { csrf, apiToken } = useContext(AuthContext)

  return (
    <Modal
      actions={[
        'Cancel',
        {
          key: 'delete',
          content: 'Delete',
          negative: true,
          onClick: async () => {
            await deleteRepo(projectName, csrf, apiToken)
            // invalidate swr cache for `projects/mine` page.
            await invalidateCache()
          },
        },
      ]}
      content={`Are you sure you want to delete the ${projectName} project?`}
      header="Heads up!"
      trigger={<Button color="red" content="Delete" />}
    />
  )
}

DeleteModal.propTypes = {
  projectName: string.isRequired,
  invalidateCache: func.isRequired,
}

export default DeleteModal
