import React, { useState } from 'react'
import { Button, Modal, Tab } from 'semantic-ui-react'

const UploadModal = ({ activeTab }) => {
  const [open, setOpen] = useState(false)
  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Button content="Upload" />}
    >
      <Modal.Header>Select files</Modal.Header>
      <Modal.Content image scrolling>
        <Modal.Description>
          <TabExampleBasic activeTab={activeTab} />
        </Modal.Description>
      </Modal.Content>
    </Modal>
  )
}

const panes = [
  { menuItem: 'PCB Files', render: () => <Tab.Pane>Tab 1 Content</Tab.Pane> },
  { menuItem: 'BOM', render: () => <Tab.Pane>Tab 2 Content</Tab.Pane> },
  { menuItem: 'README', render: () => <Tab.Pane>Tab 3 Content</Tab.Pane> },
]

const TabExampleBasic = ({ activeTab }) => (
  <Tab panes={panes} activeIndex={activeTab} />
)

export default UploadModal
