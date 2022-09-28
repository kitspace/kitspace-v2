import React, { useState, useEffect } from 'react'
import { composeServerSideProps } from 'next-composition'
import { Grid, Divider } from 'semantic-ui-react'

import { NoOp, SyncOp, UploadOp } from '@components/NewProject/Ops'
import { withRequireSignIn } from '@utils/authHandlers'
import Page from '@components/Page'
import Sync from '@components/NewProject/Sync'
import Upload from '@components/NewProject/Upload'
import styles from './index.module.scss'

const rowStyle = { paddingBottom: '10%', paddingTop: '10%' }

const New = () => {
  const [isBigScreen, setIsBigScreen] = useState(true)
  const [userOp, setUserOp] = useState(NoOp)

  const handleResize = () =>
    setIsBigScreen(window.matchMedia('(min-width: 1200px)').matches)

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Page title="Add a project - Kitspace">
      {isBigScreen ? (
        <Grid centered stackable className={styles.projectsNew} columns={2}>
          <Grid.Row>
            {userOp !== UploadOp && (
              <Grid.Column className={styles.optionColumn}>
                <Sync setUserOp={setUserOp} />
              </Grid.Column>
            )}
            {userOp === NoOp && (
              <Divider vertical className={styles.divider}>
                Or
              </Divider>
            )}
            {userOp !== SyncOp && (
              <Grid.Column className={styles.optionColumn}>
                <Upload setUserOp={setUserOp} />
              </Grid.Column>
            )}
          </Grid.Row>
        </Grid>
      ) : (
        <Grid centered className={styles.projectsNew} columns={1}>
          <Grid.Column>
            {userOp !== UploadOp && (
              <Grid.Row style={rowStyle}>
                <Sync setUserOp={setUserOp} />
              </Grid.Row>
            )}
            {userOp === NoOp && (
              <Divider horizontal className={styles.divider}>
                Or
              </Divider>
            )}
            {userOp !== SyncOp && (
              <Grid.Row style={rowStyle}>
                <Upload setUserOp={setUserOp} />
              </Grid.Row>
            )}
          </Grid.Column>
        </Grid>
      )}
    </Page>
  )
}

export const getServerSideProps = composeServerSideProps({
  use: [withRequireSignIn('/projects/new')],
})

export default New
