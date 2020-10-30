import React, { useState, useCallback } from 'react'
import { Grid, Divider, Input, Button } from 'semantic-ui-react'
import path from 'path'
import { useDropzone } from 'react-dropzone'

import styles from './new.module.scss'
import { Page } from '../../components/Page'

const New = () => {
  return (
    <Page title="new" reqSignIn>
      <div
        className={`${styles.projectsNew} ui two column stackable center aligned grid`}
      >
        <Grid.Row>
          <Sync />
          <Divider className={styles.divider} vertical>
            Or
          </Divider>
          <DropZone />
        </Grid.Row>
      </div>
    </Page>
  )
}

const DropZone = () => {
  const onDrop = useCallback(acceptedFiles => {
    console.log(acceptedFiles)
  }, [])

  const { acceptedFiles, getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
  })

  const files = acceptedFiles.map(file => (
    <li key={file.name}>
      {file.name} - {file.size} bytes
    </li>
  ))

  return (
    <Grid.Column className={styles.optionColumn}>
      <section style={{}}>
        <div
          {...getRootProps({ className: 'dropzone' })}
          style={{ margin: '2rem 0' }}
        >
          <input {...getInputProps()} />
          <p>Drop files here, or click to select files</p>
          <Button content="Open file dialog" onClick={open} />
        </div>
        <aside
          style={
            acceptedFiles.length === 0
              ? { display: 'none' }
              : { display: 'initial' }
          }
        >
          <h4>Files</h4>
          <ul>{files}</ul>
        </aside>
      </section>
    </Grid.Column>
  )
}

const Sync = () => {
  const [loading, setLoading] = useState(false)

  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'
  const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

  const [remoteRepo, setRemoteRepo] = useState('')

  // TODO: the auth context should return the user not only the current authentication state.
  const uid = window.session?.user?.id || null
  const _csrf = window.session._csrf

  const handleClick = async () => {
    setLoading(true)

    const clone_addr = remoteRepo || remoteRepoPlaceHolder
    const repo_name = urlToName(clone_addr)
    const endpoint = `${gitea_public_url}/repos/migrate?_csrf=${_csrf}`
    const giteaOptions = {
      clone_addr,
      uid,
      repo_name,
      mirror: false,
      wiki: false,
      private: false,
      pull_requests: false,
      releases: true,
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(giteaOptions),
    })

    if(res.ok) {
      const body = await res.json()
      console.log(body)
      setLoading(false)
    } else {
      console.log(res)
      setLoading(false)
    }
  }

  return (
    <Grid.Column className={styles.optionColumn}>
      <div>
        <p>Sync an existing Git repository</p>
        <div className={styles.syncSide}>
          <Input
            className={styles.urlInput}
            style={{ maxHeight: 37 }}
            fluid
            onChange={e => setRemoteRepo(e.target.value)}
            placeholder={remoteRepoPlaceHolder}
            value={remoteRepo}
          />
          <div className={styles.syncButton}>
            <Button color="green" onClick={handleClick} loading={loading} disabled={loading}>
              Sync
            </Button>
          </div>
        </div>
      </div>
    </Grid.Column>
  )
}

function urlToName(url) {
  url = new URL(url)
  return path.basename(url.pathname, path.extname(url.pathname))
}

export default New
