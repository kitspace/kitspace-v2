import React from 'react'
import { composeInitialProps } from 'next-composition'

import { withRequireSignIn } from '@utils/authHandlers'
import Page from '@components/Page'

const Settings = () => {
  return (
    <Page title="Kitspace| Settings">
      <h1>Settings</h1>
    </Page>
  )
}

Settings.getInitialProps = composeInitialProps({
  use: [withRequireSignIn('/settings')],
})

export default Settings
