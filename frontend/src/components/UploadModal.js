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

const defaultAssetsPaths = {
  PCBFiles: 'gerber',
  BOMFile: '1-click-bom.tsv',
  READMEFile: 'README.md'
}

const UploadModal = ({ activeTab: defaultActiveTab, files, kitspaceYAML }) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [kitspaceYAMLAsset, setKitspaceYAMLAsset] = useState('')

  /**
   * Passed to checkboxes to select the asset(file/folder).
   * @param {object} node gitea file or directory.
   */
  const select = (node, checked) => {
    if (checked) {
      setSelected(node)
      setKitspaceYAMLAsset(node.path)
    }
  }

  useEffect(() => {
    if (selected != null && hasChangedSelectedAsset()) {
      submit()
      setOpen(false)
    }
  }, [selected])

  useEffect(() => populateChecked(), [open])

  const activeTab = () => document.querySelector('.menu > .active')?.innerHTML

  const submit = async () => {
    const submitSelected = asset => submitKitspaceYaml(selected, asset)
    switch (activeTab()) {
      case TabsNames.PCBFiles:
        submitSelected('gerbers')
        break
      case TabsNames.BOMFile:
        submitSelected('bom')
        break
      case TabsNames.READMEFile:
        submitSelected('readme')
        break
    }
  }

  const populateChecked = () => {
    switch (activeTab()) {
      case TabsNames.PCBFiles:
        setKitspaceYAMLAsset(kitspaceYAML?.gerbers || defaultAssetsPaths.PCBFiles)
        break
      case TabsNames.BOMFile:
        setKitspaceYAMLAsset(kitspaceYAML?.bom || defaultAssetsPaths.BOMFile)
        break
      case TabsNames.READMEFile:
        setKitspaceYAMLAsset(kitspaceYAML?.readme || defaultAssetsPaths.READMEFile)
        break
    }
  }

  const hasChangedSelectedAsset = () => {
    switch (activeTab()) {
      case TabsNames.PCBFiles:
        return kitspaceYAML.gerbers !== selected.path && defaultAssetsPaths.PCBFiles !== selected.path
      case TabsNames.BOMFile:
        return kitspaceYAML.bom !== selected.path && defaultAssetsPaths.BOMFile !== selected.path
      case TabsNames.READMEFile:
        return kitspaceYAML.readme !== selected.path && defaultAssetsPaths.READMEFile !== selected.path
      default:
        break
    }

  }
  const TabsProps = {
    activeTab: defaultActiveTab,
    files,
    select,
    selected,
    externallyMarked: kitspaceYAMLAsset,
    onTabChange: () => {
      // Make sure the tab name has changed
      const sleep = setTimeout(populateChecked, 50)
      return () => clearTimeout(sleep)

    },
  }

  return (
    <div
      style={{
        padding: '1rem 0',
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
        trigger={<Button content={`Upload ${defaultActiveTab} file`} />}
      >
        <Modal.Header>Select files</Modal.Header>
        <Modal.Content image scrolling>
          <Modal.Description>
            <Tabs {...TabsProps} />
          </Modal.Description>
        </Modal.Content>
      </Modal>
    </div>
  )
}

const Tabs = ({
  activeTab,
  files,
  select,
  selected,
  externallyMarked,
  onTabChange,
}) => {
  const tabsMap = { PCB: 0, BOM: 1, README: 2 }
  const commonTabProps = { files, select, selected, externallyMarked }
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

const UploadTab = ({
  files,
  select,
  selected,
  externallyMarked,
  allowFiles,
  allowFolders,
}) => {
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
          select={select}
          selected={selected}
          externallyMarked={externallyMarked}
          files={files}
          style={{ paddingLeft: '1rem', overflow: 'auto' }}
        />
      </div>
    </Tab.Pane>
  )
}

export default UploadModal
