import React from 'react'
import { useRouter } from 'next/router'
import { Grid, Tab } from 'semantic-ui-react'

import SignUpForm from '@components/SignUpForm'
import SignInForm from '@components/SignInForm'
import { Page } from '@components/Page'

export const getStaticProps = () => {
  return {
    props: {},
  }
}

// Explicitly mark as static.
// Due to using `getInitialProps` in `_app.js` pages that can be statically built aren't.
const Login = () => {
  const router = useRouter()

  let defaultActiveIndex

  if (router.query.hasOwnProperty('sign_up')) {
    defaultActiveIndex = 0
  } else {
    defaultActiveIndex = 1
  }

  return (
    <Page title="login" reqSignOut>
      <Grid style={{ maxWidth: '500px', margin: 'auto' }} verticalAlign="middle">
        <Grid.Column>
          <Tab
            panes={[
              { menuItem: 'Sign up', render: () => <SignUpForm /> },
              { menuItem: 'Log in', render: () => <SignInForm /> },
            ]}
            defaultActiveIndex={defaultActiveIndex}
          />
        </Grid.Column>
      </Grid>
    </Page>
  )
}

export default Login
