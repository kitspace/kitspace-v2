import React from 'react'

import { Button, Modal } from "semantic-ui-react";
import { deleteRepo } from "@utils/giteaApi";

const DeleteModal = ({ projectName, csrf }) => {

  return (
    <Modal
      trigger={<Button content="Delete" color="red" />}
      heade="Heads up!"
      content={`Are you sure you want to delete the ${projectName} project?`}
      actions={[
        'Cancel',
        {
          key: 'delete',
          content: 'Delete',
          negative: true,
          onClick: async () => {
            await deleteRepo(projectName, csrf)
          },
        },
      ]}
    />
  )
}
export default DeleteModal