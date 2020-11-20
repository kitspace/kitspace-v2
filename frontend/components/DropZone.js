import React, { useEffect, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'

import { UploadContext } from '@/contexts/UploadContext'
import { useDropzone } from 'react-dropzone'
import { Button, Grid, List } from 'semantic-ui-react'
import styles from '../pages/projects/new.module.scss'
import { AuthContext } from '@/contexts/AuthContext'

const DropZone = () => {
  const { loadFiles, loadedFiles } = useContext(UploadContext)
  const { pathname, push } = useRouter()
  const { user } = useContext(AuthContext)

  useEffect(() => {
    console.log(loadedFiles)
  }, [loadedFiles])

  const onDrop = useCallback(async acceptedFiles => {
    loadFiles(acceptedFiles)
    if (pathname === '/projects/new') {
      await push(`/projects/update/${user.login}/newProject`)
    }
  }, [])

  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
  })

  const files = acceptedFiles.map(file => (
    <List.Item key={file.name}>
      <List.Icon name="file" />
      <List.Content>
        <List.Header>{file.name}</List.Header>
        <List.Description>{file.size} bytes</List.Description>
      </List.Content>
    </List.Item>
  ))

  return (
    <Grid.Column className={styles.optionColumn}>
      <section>
        <div
          {...getRootProps({ className: 'dropzone' })}
          style={{ margin: '2rem 0' }}
        >
          <input {...getInputProps()} />
          <p>Drop files here, or click to select files</p>
          <Button color="green" content="Open file dialog" onClick={open} />
        </div>
        <aside
          style={
            acceptedFiles.length === 0
              ? { display: 'none' }
              : { display: 'initial' }
          }
        >
          <h4>Files</h4>
          <List relaxed>{files}</List>
        </aside>
      </section>
    </Grid.Column>
  )
}

export default DropZone
