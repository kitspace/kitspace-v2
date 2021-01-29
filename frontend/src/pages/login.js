import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Grid, Tab } from 'semantic-ui-react'

import SignUpForm from '@components/SignUpForm'
import SignInForm from '@components/SignInForm'
import { Page } from '@components/Page'

// Explicitly mark as static.
// Due to using `getInitialProps` in `_app.js` pages that can be statically built aren't.
const Login = () => {
  const [openPane, setOpenPane] = useState(1)
  const { query } = useRouter()

  useEffect(() => {
    if (query.hasOwnProperty('sign_up')) {
      setOpenPane(0)
    } else {
      setOpenPane(1)
    }
  }, [query])

  return (
    <Page title="login" reqSignOut>
      <Grid style={{ maxWidth: '500px', margin: 'auto' }} verticalAlign="middle">
        <Grid.Column>
          <Tab
            panes={[
              { menuItem: 'Sign up', render: () => <SignUpForm /> },
              { menuItem: 'Log in', render: () => <SignInForm /> },
            ]}
            defaultActiveIndex={openPane}
          />
        </Grid.Column>
      </Grid>
    </Page>
  )
}

export default Login
