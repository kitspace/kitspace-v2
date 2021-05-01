import React, { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button, Modal, Tab } from 'semantic-ui-react'

const DropZone = dynamic(() => import('@components/DropZone'))
const FilesPreview = dynamic(() => import('@components/FilesPreview'))

const UploadModal = ({ activeTab, canUpload, files }) => {
  const [open, setOpen] = useState(false)
  const [allChecked, setAllChecked] = useState([])

  const mark = (node, checked) => {
    if (checked) {
       setAllChecked([...allChecked, node])
    } else {
      setAllChecked(allChecked.filter(n => n !== node))
    }
  }

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
        closeIcon
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        trigger={<Button content={`Upload ${activeTab} file`} />}
      >
        <Modal.Header>Select files</Modal.Header>
        <Modal.Content image scrolling>
          <Modal.Description>
            <Tabs activeTab={activeTab} files={files} mark={mark} />
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => console.log(allChecked)}
            positive
            content="Submit"
            disabled={allChecked.length === 0}
          />
        </Modal.Actions>
      </Modal>
    </div>
  ) : null
}

const Tabs = ({ activeTab, files, mark = { mark } }) => {
  const tabsMap = { PCB: 0, BOM: 1, README: 2 }
  const panes = [
    {
      menuItem: 'PCB Files',
      render: () => <UploadTab files={files} mark={mark} trigger="PCB" />,
    },
    {
      menuItem: 'BOM',
      render: () => <UploadTab files={files} mark={mark} trigger="BOM" />,
    },
    {
      menuItem: 'README',
      render: () => <UploadTab files={files} mark={mark} trigger="README" />,
    },
  ]

  return <Tab panes={panes} defaultActiveIndex={tabsMap[activeTab]} />
}

const UploadTab = ({ files, trigger, mark }) => {
  return (
    <Tab.Pane>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <DropZone
          style={{ marginRight: '0.5rem', maxHeight: '200px' }}
          trigger={trigger}
        />
        <FilesPreview
          mark={mark}
          files={files}
          style={{ paddingLeft: '1rem', overflow: 'auto' }}
        ></FilesPreview>
      </div>
    </Tab.Pane>
  )
}

export default UploadModal
