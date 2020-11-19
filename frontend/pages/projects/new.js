import React, { useState, useContext } from 'react'
import { Grid, Divider, Input, Button } from 'semantic-ui-react'

import styles from './new.module.scss'
import { Page } from '@/components/Page'
import DropZone from '@/components/DropZone'
import { AuthContext } from '../../contexts/AuthContext'
import { migrateRepo } from '../../utils/giteaApi'

const New = () => {
  return (
    <Page title="new">
      <div
        className={`${styles.projectsNew} ui two column stackable center aligned grid`}
      >
        <Grid.Row>
          <Grid.Column className={styles.optionColumn}>
            <Sync />
          </Grid.Column>
          <Divider className={styles.divider} vertical>
            Or
          </Divider>
            <Grid.Column className={styles.optionColumn}>
              <DropZone />
            </Grid.Column>
        </Grid.Row>
      </div>
    </Page>
  )
}

const Sync = () => {
  const [loading, setLoading] = useState(false)
  const { csrf, user } = useContext(AuthContext)

  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'
  const [remoteRepo, setRemoteRepo] = useState('')

  const uid = user?.id
  const _csrf = csrf

  const handleClick = async () => {
    setLoading(true)
    const repo = remoteRepo || remoteRepoPlaceHolder
    const migrateSuccessfully = await migrateRepo(repo, uid, _csrf)

    if (migrateSuccessfully) {
      setLoading(false)
    }
  }

  return (
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
            <Button
              color="green"
              onClick={handleClick}
              loading={loading}
              disabled={loading}
            >
              Sync
            </Button>
          </div>
        </div>
      </div>
  )
}

export default New
