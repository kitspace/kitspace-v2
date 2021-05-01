import React, { useState, useEffect } from 'react'

import { Icon, List } from 'semantic-ui-react'

const Tree = ({ files, mark }) => {
  if (files == null) {
    return <span>Loading...</span>
  }
  const nodes = files?.map(node => (
    <List.Item key={node.path}>
      <TreeNode node={node} mark={mark} />
    </List.Item>
  ))

  return <List>{nodes}</List>
}

const TreeNode = ({ node, mark }) => {
  const [toggled, setToggled] = useState(false)
  const [checked, setChecked] = useState(false)
  const [nodeData, setNodeData] = useState([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    mark(node, checked)
  }, [checked])

  useEffect(() => {
    fetch(node.url)
      .then(r => r.json())
      .then(setNodeData)
      .catch(e => {
        setFailed(true)
        console.error(e)
      })
  }, [toggled])

  if (node.type === 'file') {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          style={{ marginRight: '0.5rem' }}
          type="checkbox"
          checked={checked}
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
  } else if (node.type === 'dir') {
    return (
      <details
        style={{ paddingLeft: '0.3rem' }}
        onToggle={() => setToggled(!toggled)}
      >
        <summary>
          <Icon name="folder"></Icon>
          {node.name}
        </summary>
        <div style={{ paddingLeft: '1.3rem' }}>
          <Tree files={nodeData} mark={mark} />
          {failed ? 'Failed to load files!' : null}
        </div>
      </details>
    )
  } else {
    return <span>Loading...</span>
  }
}

export default Tree
