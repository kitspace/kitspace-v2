import React, { useState, useEffect } from 'react'
import useSWR from 'swr'

import { Icon, List, Loader } from 'semantic-ui-react'

const Tree = ({ files, mark }) => {
  const nodes = files?.map(node => (
    <List.Item key={node.path}>
      <TreeNode node={node} mark={mark} />
    </List.Item>
  ))

  return <List>{nodes}</List>
}

const TreeNode = ({ node, mark }) => {
  const [toggled, setToggled] = useState(false)
  const { data, error } = useSWR(toggled ? node.url : null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    mark(node, checked)
  }, [checked])

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
          {!(data || error) ? (
            <Loader active inline />
          ) : (
            <Tree files={data} mark={mark} />
          )}
          {error ? 'Failed to load files!' : null}
        </div>
      </details>
    )
  }
}

export default Tree
