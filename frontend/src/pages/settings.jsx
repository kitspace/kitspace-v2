import React from 'react'

import { withRequireSignIn } from '@utils/authHandlers'
import Page from '@components/Page'

const Settings = () => {
  return (
    <Page title="Kitspace| Settings">
      <h1>Settings</h1>
    </Page>
  )
}

export const getServerSideProps = withRequireSignIn('/settings')

export default Settings
