import React, { useEffect, useState, useContext, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button, Modal, Tab } from 'semantic-ui-react'

import { AuthContext } from '@contexts/AuthContext'
import { submitKitspaceYaml } from '@utils/projectPage'
import useKitspaceYAML from '@hooks/useKitspaceYAML'
import { array, bool, func, object, objectOf, string } from 'prop-types'

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
  READMEFile: 'README.md',
}

const UploadModal = ({
  kitspaceYAMLExists,
  files,
  kitspaceYAMLPreloaded,
  projectFullname,
  onDrop,
}) => {
  const { user, csrf } = useContext(AuthContext)
  const { kitspaceYAML, mutate } = useKitspaceYAML(projectFullname, {
    initialData: kitspaceYAMLPreloaded,
  })

  const [open, setOpen] = useState(false)
  const [modalTriggerLoading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [kitspaceYAMLAsset, setKitspaceYAMLAsset] = useState('')

  const activeTab = () => document.querySelector('.menu > .active')?.innerHTML

  const submit = useCallback(async () => {
    const submitSelected = assetName =>
      submitKitspaceYaml(
        selected,
        kitspaceYAML,
        assetName,
        projectFullname,
        user,
        csrf,
        kitspaceYAMLExists,
      )

    switch (activeTab()) {
      case TabsNames.PCBFiles:
        return submitSelected('gerbers')
      case TabsNames.BOMFile:
        return submitSelected('bom')
      case TabsNames.READMEFile:
        return submitSelected('readme')
      default:
        return false
    }
  }, [kitspaceYAML, kitspaceYAMLExists, selected, projectFullname, user, csrf])

  const populateChecked = useCallback(() => {
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
      default:
        break
    }
  }, [kitspaceYAML])

  const hasChangedSelectedAsset = useCallback(() => {
    switch (activeTab()) {
      case TabsNames.PCBFiles:
        return (
          selected.path !== (kitspaceYAML.gerbers || defaultAssetsPaths.PCBFiles)
        )
      case TabsNames.BOMFile:
        return selected.path !== (kitspaceYAML.bom || defaultAssetsPaths.BOMFile)
      case TabsNames.READMEFile:
        return (
          selected.path !== (kitspaceYAML.readme || defaultAssetsPaths.READMEFile)
        )
      default:
        return false
    }
  }, [kitspaceYAML, selected?.path])

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
      setLoading(true)
      submit().then(submittedSuccessfully => {
        if (submittedSuccessfully) {
          mutate()
          setLoading(false)
        }
      })
      setOpen(false)
    }
  }, [selected, hasChangedSelectedAsset, submit, mutate])

  useEffect(() => populateChecked(), [open, kitspaceYAML, populateChecked])

  const TabsProps = {
    files,
    select,
    selected,
    externallyMarked: kitspaceYAMLAsset,
    onTabChange: () => {
      // Make sure the tab name has changed
      const sleep = setTimeout(populateChecked, 50)
      return () => clearTimeout(sleep)
    },
    onDrop,
  }

  const onOpen = () => {
    mutate()
    setOpen(true)
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
        onOpen={onOpen}
        open={open}
        trigger={
          <Button
            content="Edit files"
            loading={modalTriggerLoading}
            disabled={modalTriggerLoading}
          />
        }
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
  files,
  select,
  selected,
  externallyMarked,
  onTabChange,
  onDrop,
}) => {
  const commonTabProps = { files, select, selected, externallyMarked, onDrop }
  const panes = [
    {
      menuItem: TabsNames.PCBFiles,
      // PCB Files should be a folder
      render: () => (
        <UploadTab {...commonTabProps} allowFiles={false} allowFolders />
      ),
    },
    {
      menuItem: TabsNames.BOMFile,
      // BOM Files should be a single file
      render: () => (
        <UploadTab {...commonTabProps} allowFiles allowFolders={false} />
      ),
    },
    {
      menuItem: TabsNames.READMEFile,
      // README file should be a single file
      render: () => (
        <UploadTab {...commonTabProps} allowFiles allowFolders={false} />
      ),
    },
  ]

  return <Tab onTabChange={onTabChange} panes={panes} />
}

const UploadTab = ({
  files,
  select,
  selected,
  externallyMarked,
  allowFiles,
  allowFolders,
  onDrop,
}) => (
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
        onDrop={onDrop}
      />
      <FilesPreview
        allowFiles={allowFiles}
        allowFolders={allowFolders}
        select={select}
        selected={selected}
        externallyMarked={externallyMarked}
        files={files}
        style={{ paddingLeft: '1rem', overflow: 'auto' }}
      />
    </div>
  </Tab.Pane>
)

UploadModal.propTypes = {
  kitspaceYAMLExists: bool.isRequired,
  files: array.isRequired,
  kitspaceYAMLPreloaded: objectOf(string),
  projectFullname: string.isRequired,
  onDrop: func.isRequired,
}

UploadModal.defaultProps = {
  kitspaceYAMLPreloaded: null,
}

Tabs.propTypes = {
  files: array.isRequired,
  select: func.isRequired,
  selected: object,
  externallyMarked: string.isRequired,
  onTabChange: func.isRequired,
  onDrop: func.isRequired,
}

Tabs.defaultProps = {
  selected: null,
}

UploadTab.propTypes = {
  files: array.isRequired,
  select: func.isRequired,
  selected: object,
  externallyMarked: string.isRequired,
  allowFiles: bool.isRequired,
  allowFolders: bool.isRequired,
  onDrop: func.isRequired,
}

UploadTab.defaultProps = {
  selected: null,
}

export default UploadModal
