import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button, Modal, Tab } from 'semantic-ui-react'

import { submitKitspaceYaml } from '@utils/index'

const DropZone = dynamic(() => import('@components/DropZone'))
const FilesPreview = dynamic(() => import('@components/FilesPreview'))

const TabsNames = {
  PCBFiles: 'PCB Files',
  BOMFile: 'BOM File',
  READMEFile: 'README File',
}
const UploadModal = ({ activeTab, canUpload, files }) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  /**
   * Passed to checkboxes to select the asset(file/folder).
   * @param {object} node gitea file or directory.
   * @param {boolean} checked whether to mark this file as checked or unchecked.
   */
  const select = (node, checked) => {
    if (checked) {
      setSelected(node)
    }
  }

  useEffect(() => {
    if (selected != null) {
      submit()
      setOpen(false)
    }
  }, [selected])

  const submit = async () => {
    const activeTab = document.querySelector('.menu > .active')?.innerHTML
    const submitSelected = asset => submitKitspaceYaml(selected, asset)
    switch (activeTab) {
      case TabsNames.PCBFiles:
        submitSelected('gerbers')
        break
      case TabsNames.BOMFiles:
        submitSelected('bom')
        break
      case TabsNames.READMEFile:
        submitSelected('readme')
        break
      default:
        break
    }
  }

  const clearChecked = () => setSelected(null)
  const TabsProps = {
    activeTab,
    files,
    select,
    selected,
    onTabChange: clearChecked,
  }

  return true ? (
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
      </Modal>
    </div>
  ) : null
}

const Tabs = ({ activeTab, files, select, selected, onTabChange }) => {
  const tabsMap = { PCB: 0, BOM: 1, README: 2 }
  const commonTabProps = { files, select, selected }
  const panes = [
    {
      menuItem: TabsNames.PCBFiles,
      // PCB Files should be a folder
      render: () => <UploadTab {...commonTabProps} allowFiles={false} />,
    },
    {
      menuItem: TabsNames.BOMFile,
      // BOM Files should be a single file
      render: () => <UploadTab {...commonTabProps} allowFolders={false} />,
    },
    {
      menuItem: TabsNames.READMEFile,
      // README file should be a single file
      render: () => <UploadTab {...commonTabProps} allowFolders={false} />,
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

const UploadTab = ({ files, select, selected, allowFiles, allowFolders }) => {
  return (
    <Tab.Pane>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          background:
            'linear-gradient(rgb(238 238 238),rgb(238 238 238)) center/2px 100% no-repeat',
        }}
      >
        <DropZone
          allowFiles={allowFiles}
          allowFolders={allowFolders}
          style={{ maxHeight: '200px' }}
        />
        <FilesPreview
          selected={selected}
          select={select}
          files={files}
          style={{ paddingLeft: '1rem', overflow: 'auto' }}
        />
      </div>
    </Tab.Pane>
  )
}

export default UploadModal
