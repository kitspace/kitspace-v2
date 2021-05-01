import React, { useState } from 'react'
import useSWR from 'swr'

import { Icon, List, Loader } from 'semantic-ui-react'

const Tree = ({ files }) => {
  const nodes = files?.map(node => (
    <List.Item key={node.path}>
      <TreeNode node={node} />
    </List.Item>
  ))

  return <List>{nodes}</List>
}

const TreeNode = ({ node }) => {
  const [toggled, setToggled] = useState(false)
  const { data, error } = useSWR(toggled ? node.url : null)

  if (node.type === 'file') {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input style={{ marginRight: '0.5rem' }} type="checkbox" />
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
          {!(data || error) ? <Loader active inline /> : <Tree files={data} />}
          {error ? 'Failed to load files!' : null}
        </div>
      </details>
    )
  }
}

export default Tree
