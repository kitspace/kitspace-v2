import React, { useState } from 'react'
import { Grid, Divider, Input, Button, Modal} from 'semantic-ui-react'
import path from 'path'

import styles from './new.module.scss'
import { Page } from '../../components/Page'

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

function New({ _csrf }) {
  return (
    <Page title="new">
      <div
        className={`${styles.projectsNew} ui two column stackable center aligned grid`}
      >
        <Grid.Row>
          <Sync />
          <Divider className={styles.divider} vertical>
            Or
          </Divider>
          <UploadModal />
        </Grid.Row>
      </div>
    </Page>
  )
}

const UploadModal = () => {
  const [open, setOpen] = useState(false)

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={
        <Grid.Column className={styles.optionColumn}>
          <div>
            <p>Upload a KiCad folder</p>
            <Button content="Upload" color="green" name="upload" />
          </div>
        </Grid.Column>
      }
    >
      <Modal.Header>Upload image</Modal.Header>
      <Modal.Content image>
        <Modal.Description>
          <p>Upload folder</p>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => setOpen(false)} positive>
          Ok
        </Button>
      </Modal.Actions>
    </Modal>
  )
}
const Sync = () => {
  const [remoteRepo, setRemoteRepo] = useState('')
  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'

  const uid = window.session?.user?.id || null

  const handleClick = () => {
    const clone_addr = remoteRepo || remoteRepoPlaceHolder
    const repo_name = urlToName(clone_addr)
    fetch(gitea_public_url + '/repos/migrate?_csrf=' + _csrf, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clone_addr,
        uid,
        repo_name,
        mirror: false,
        wiki: false,
        private: false,
        pull_requests: false,
        releases: true,
      }),
    })
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
            <Button color="green" onClick={handleClick}>
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
