import React from 'react'
import { Grid } from 'semantic-ui-react'

import { withRequireSignIn } from '@utils/authHandlers'
import Page from '@components/Page'
import Sync from '@components/NewProject/Sync'
import styles from './index.module.scss'

const New = () => {
  return (
    <Page title="Add a project - Kitspace">
      <Grid centered stackable className={styles.projectsNew} columns={2}>
        <Grid.Row>
          <Grid.Column className={styles.optionColumn}>
            <Sync setUserOp={() => {}} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Page>
  )
}

export const getServerSideProps = withRequireSignIn('/projects/new')

export default New
