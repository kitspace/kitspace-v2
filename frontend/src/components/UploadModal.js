import React, { useState } from 'react'
import { Button, Modal, Tab } from 'semantic-ui-react'

const UploadModal = ({ activeTab, canUpload }) => {
  const [open, setOpen] = useState(false)

  return canUpload ? (
    <div
      style={{
        padding: '0.5rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
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
    </div>
  ) : null
}

const panes = [
  { menuItem: 'PCB Files', render: () => <Tab.Pane>Tab 1 Content</Tab.Pane> },
  { menuItem: 'BOM', render: () => <Tab.Pane>Tab 2 Content</Tab.Pane> },
  { menuItem: 'README', render: () => <Tab.Pane>Tab 3 Content</Tab.Pane> },
]

const TabExampleBasic = ({ activeTab }) => (
  <Tab panes={panes} defaultActiveIndex={activeTab} />
)

export default UploadModal
