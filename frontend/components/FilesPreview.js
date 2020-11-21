import React, { useContext } from 'react'

import { UploadContext } from '@/contexts/UploadContext'
import { List } from 'semantic-ui-react'

const FilesPreview = () => {
  const { allFiles } = useContext(UploadContext)

  const files = allFiles.map(file => (
    <List.Item key={file.name}>
      <List.Icon name="file" />
      <List.Content>
        <List.Header>{file.name}</List.Header>
        <List.Description>{file.size} bytes</List.Description>
      </List.Content>
    </List.Item>
  ))

  return (
    <div
      style={allFiles.length === 0 ? { display: 'none' } : { display: 'initial' }}
    >
      <h4>Files</h4>
      <List relaxed>{files}</List>
    </div>
  )
}

export default FilesPreview
