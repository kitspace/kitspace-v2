import React from 'react'

import { List } from 'semantic-ui-react'

const FilesPreview = ({ files }) => {
  const filesList = files?.map(file => (
    <List.Item key={file.name}>
      <List.Icon name="file" />
      <List.Content>
        <List.Header>{file.name}</List.Header>
        <List.Description>{file.size} bytes</List.Description>
      </List.Content>
    </List.Item>
  ))

  return (
    <div style={files?.length === 0 ? { display: 'none' } : { display: 'initial' }}>
      <h4>Files</h4>
      <List relaxed>{filesList}</List>
    </div>
  )
}

export default FilesPreview
