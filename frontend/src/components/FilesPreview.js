import { arrayOf, bool, func, object, string } from 'prop-types'
import React, { useState, useEffect } from 'react'
import { Icon, List } from 'semantic-ui-react'

import styles from './FilesPreview.module.scss'

const Tree = ({
  files,
  select,
  selected,
  externallyMarked,
  allowFiles,
  allowFolders,
}) => {
  if (files == null) {
    return <span>Loading...</span>
  }
  const nodes = files?.map(node => (
    <List.Item key={node.path}>
      <TreeNode
        node={node}
        select={select}
        selected={selected}
        externallyMarked={externallyMarked}
        marked={selected === node || node.path === externallyMarked}
        allowFiles={allowFiles}
        allowFolders={allowFolders}
      />
    </List.Item>
  ))

  return <List className={styles.tree}>{nodes}</List>
}

const TreeNode = ({
  node,
  select,
  selected,
  marked,
  externallyMarked,
  allowFiles,
  allowFolders,
}) => {
  const [toggled, setToggled] = useState(false)
  const [checked, setChecked] = useState(false)
  const [nodeData, setNodeData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    select(node, checked)
  }, [checked])

  useEffect(() => {
    // Used to control the checkbox externally.
    if (marked != null) {
      setChecked(marked)
    }
  }, [marked])

  useEffect(() => {
    // Fetch files inside a directory when toggling it in the tree preview.
    // eslint-disable-next-line no-prototype-builtins
    if (node.hasOwnProperty('url')) {
      fetch(node.url)
        .then(r => r.json())
        .then(setNodeData)
        .catch(e => {
          setFailed(true)
          console.error(e)
        })
    }
  }, [toggled])

  if (node.type === 'file') {
    return (
      <div
        className={styles.file}
        onClick={() => setChecked(!checked)}
        onKeyPress={() => setChecked(!checked)}
        role="menuitemcheckbox"
        aria-checked={checked}
        tabIndex={-1}
      >
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={checked}
          disabled={!allowFiles}
          onChange={() => setChecked(!checked)}
        />
        <Icon name="file" />
        <div>
          <List.Content>
            <List.Header data-cy="file-name">{node.name}</List.Header>
          </List.Content>
        </div>
      </div>
    )
  }
  if (node.type === 'dir') {
    return (
      <div className={styles.dir}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={checked}
          disabled={!allowFolders}
          onChange={() => setChecked(!checked)}
        />
        <details
          style={{ paddingLeft: '0.3rem' }}
          onToggle={() => setToggled(!toggled)}
        >
          <summary>
            <Icon name="folder" />
            {node.name}
          </summary>
          <div style={{ paddingLeft: '1.3rem' }}>
            <Tree
              files={nodeData}
              select={select}
              selected={selected}
              externallyMarked={externallyMarked}
              allowFiles={allowFiles}
              allowFolders={allowFolders}
            />
            {failed ? 'Failed to load files!' : null}
          </div>
        </details>
      </div>
    )
  }
  return (
    <span>
      {node.path || node.name
        ? `Uploading ${node.path || node.name}`
        : 'Loading...'}
    </span>
  )
}

const FilesPreview = props => (
  <div>
    <p>Select from previously uploaded files:</p>
    <Tree {...props} />
  </div>
)

Tree.propTypes = {
  /* eslint-disable react/require-default-props */
  files: arrayOf(object),
  select: func.isRequired,
  selected: object,
  externallyMarked: string.isRequired,
  allowFiles: bool.isRequired,
  allowFolders: bool.isRequired,
}

TreeNode.propTypes = {
  node: object.isRequired,
  select: func.isRequired,
  // eslint-disable-next-line react/require-default-props
  selected: object,
  marked: bool.isRequired,
  externallyMarked: string.isRequired,
  allowFiles: bool.isRequired,
  allowFolders: bool.isRequired,
}

export default FilesPreview
