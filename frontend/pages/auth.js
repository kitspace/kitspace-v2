import React from 'react'
import { useRouter } from 'next/router'
import { Container, Grid, Tab } from 'semantic-ui-react'

import TitleBar from '../components/TitleBar'
import SignUpForm from '../components/SignUpForm'
import SignInForm from '../components/SignInForm'

export default function () {
  const router = useRouter()

  let defaultActiveIndex

  if (router.query.hasOwnProperty('login')) {
    defaultActiveIndex = 0
  } else {
    defaultActiveIndex = 1
  }

  return (
    <>
      <TitleBar route="/auth/" auth />
      <Container style={{ marginTop: 30 }}>
        <Grid textAlign="center" verticalAlign="middle">
          <Grid.Column style={{ maxWidth: 450 }}>
            <Tab
              panes={[
                { menuItem: 'Sign up', render: () => <SignUpForm /> },
                { menuItem: 'Login', render: () => <SignInForm /> },
              ]}
              defaultActiveIndex={defaultActiveIndex}
            />
          </Grid.Column>
        </Grid>
      </Container>
    </>
  )
}
