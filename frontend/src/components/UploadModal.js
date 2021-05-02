import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button, Modal, Tab } from 'semantic-ui-react'

import { submitKitspaceYaml } from '@utils/index'

const DropZone = dynamic(() => import('@components/DropZone'))
const FilesPreview = dynamic(() => import('@components/FilesPreview'))

const TabsNames = {
  PCBFiles: 'PCB Files',
  BOMFiles: 'BOM files',
  READMEFile: 'README Files',
}
const UploadModal = ({ activeTab, canUpload, files }) => {
  const [open, setOpen] = useState(false)
  const [allChecked, setAllChecked] = useState([])

  /**
   * Passed to check boxes to add the checked file to `allChecked` array.
   * @param {object} node gitea file or directory. 
   * @param {boolean} checked whether to mark this file as checked or unchecked.
   */
  const mark = (node, checked) => {
    if (checked) {
      setAllChecked([...allChecked, node])
    } else {
      setAllChecked(allChecked.filter(n => n !== node))
    }
  }

  const submit = async () => {
    const activeTab = document.querySelector('.menu > .active').innerHTML

    switch (activeTab) {
      case TabsNames.PCBFiles:
        submitKitspaceYaml(allChecked, 'gerbers')
        break
      case TabsNames.BOMFiles:
        submitKitspaceYaml(allChecked, 'bom')
        break
      case TabsNames.READMEFile:
        submitKitspaceYaml(allChecked, 'readme')
        break
      default:
        break
    }
  }

  const clearChecked = () => setAllChecked([])
  const TabsProps = {
    activeTab,
    files,
    mark,
    allChecked,
    onTabChange: clearChecked,
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
            <Tabs {...TabsProps} />
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={submit}
            positive
            content="Submit"
            disabled={allChecked.length === 0}
          />
        </Modal.Actions>
      </Modal>
    </div>
  ) : null
}

const Tabs = ({ activeTab, files, mark, allChecked, onTabChange}) => {
  const tabsMap = { PCB: 0, BOM: 1, README: 2 }
  const commonTabProps = { files, mark, allChecked }
  const panes = [
    {
      menuItem: TabsNames.PCBFiles,
      render: () => <UploadTab {...commonTabProps} trigger="PCB" />,
    },
    {
      menuItem: TabsNames.BOMFiles,
      render: () => <UploadTab {...commonTabProps} trigger="BOM" />,
    },
    {
      menuItem: TabsNames.READMEFile,
      render: () => <UploadTab {...commonTabProps} trigger="README" />,
    },
  ]

  return (
    <Tab
      onTabChange={onTabChange}
      panes={panes}
      defaultActiveIndex={tabsMap[activeTab]}
    />
  )
}

const UploadTab = ({ files, trigger, mark, allChecked }) => {
  return (
    <Tab.Pane>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <DropZone
          style={{ marginRight: '0.5rem', maxHeight: '200px' }}
          trigger={trigger}
        />
        <FilesPreview
          allChecked={allChecked}
          mark={mark}
          files={files}
          style={{ paddingLeft: '1rem', overflow: 'auto' }}
        />
      </div>
    </Tab.Pane>
  )
}

export default UploadModal
