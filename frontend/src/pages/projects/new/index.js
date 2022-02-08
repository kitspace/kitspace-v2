import React, { useState, useContext, useEffect } from 'react'
import { composeInitialProps } from 'next-composition'
import { Grid, Divider } from 'semantic-ui-react'

import Page from '@components/Page'
import Upload from '@components/NewProject/Upload'
import Sync from '@components/NewProject/Sync'
import { NoOp, SyncOp, UploadOp } from '@components/NewProject/Ops'
import { AuthContext } from '@contexts/AuthContext'
import { withRequireSignIn } from '@utils/authHandlers'
import styles from './index.module.scss'

const rowStyle = { paddingBottom: '10%', paddingTop: '10%' }

const New = () => {
  const { csrf, user } = useContext(AuthContext)
  const [isBigScreen, setIsBigScreen] = useState(true)
  const [userOp, setUserOP] = useState(NoOp)

  const handleResize = () =>
    setIsBigScreen(window.matchMedia('(min-width: 1200px)').matches)

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <Page title="Kitspace | New Project">
      {isBigScreen ? (
        <Grid centered stackable className={styles.projectsNew} columns={2}>
          <Grid.Row>
            {userOp !== UploadOp && (
              <Grid.Column className={styles.optionColumn}>
                <Sync csrf={csrf} setUserOp={setUserOP} user={user} />
              </Grid.Column>
            )}
            {userOp === NoOp && (
              <Divider vertical className={styles.divider}>
                Or
              </Divider>
            )}
            {userOp !== SyncOp && (
              <Grid.Column className={styles.optionColumn}>
                <Upload csrf={csrf} setUserOp={setUserOP} user={user} />
              </Grid.Column>
            )}
          </Grid.Row>
        </Grid>
      ) : (
        <Grid centered className={styles.projectsNew} columns={1}>
          <Grid.Column>
            {userOp !== UploadOp && (
              <Grid.Row style={rowStyle}>
                <Sync csrf={csrf} user={user} />
              </Grid.Row>
            )}
            {userOp === NoOp && (
              <Divider horizontal className={styles.divider}>
                Or
              </Divider>
            )}
            {userOp !== SyncOp && (
              <Grid.Row style={rowStyle}>
                <Upload csrf={csrf} user={user} />
              </Grid.Row>
            )}
          </Grid.Column>
        </Grid>
      )}
    </Page>
  )
}

New.getInitialProps = composeInitialProps({
  use: [withRequireSignIn('/projects/new')],
})

export default New
