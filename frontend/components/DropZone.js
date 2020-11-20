import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useRouter } from 'next/router'

import { UploadContext } from '@/contexts/UploadContext'
import { useDropzone } from 'react-dropzone'
import { Button, Grid, List } from 'semantic-ui-react'
import styles from '../pages/projects/new.module.scss'
import { AuthContext } from '@/contexts/AuthContext'
import { getRepoFiles, projectNameFromPath } from '@utils/giteaApi'

const DropZone = () => {
  const { loadFiles, loadedFiles, setProject, project } = useContext(UploadContext)
  const { pathname, push, asPath } = useRouter()
  const { user, csrf } = useContext(AuthContext)

  const [repoFiles, setRepoFiles] = useState([])
  const [allFiles, setAllFiles] = useState([])
  const isNewProjectPage = RegExp('^/projects/new').test(pathname)

  useEffect(() => {
    const projectName = projectNameFromPath(asPath)
    setProject(projectName)
  }, [asPath])

  useEffect(() => {
    const getRemoteFiles = async () => {
      const files = await getRepoFiles(project, csrf)
      setRepoFiles(files)
    }
    if (!isNewProjectPage) {
      getRemoteFiles().then()
    }
  }, [project])


  useEffect(() => {
    setAllFiles([...loadedFiles, ...repoFiles])
  }, [loadedFiles, repoFiles])


  const onDrop = useCallback(async acceptedFiles => {
    loadFiles(acceptedFiles)

    if (isNewProjectPage) {
      await push(`/projects/update/${user.login}/new`)
    }
  }, [])

  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
  })

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
