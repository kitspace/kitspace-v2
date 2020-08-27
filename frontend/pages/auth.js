import React from 'react'
import {useRouter} from 'next/router'
import {Container, Grid, Tab} from 'semantic-ui-react'

import TitleBar from '../components/TitleBar'
import LoginForm from '../components/LoginForm'
import SignUpForm from '../components/SignUpForm'

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
      <Container style={{marginTop: 30}}>
        <Grid textAlign="center" verticalAlign="middle">
          <Grid.Column style={{maxWidth: 450}}>
            <Tab
              panes={[
                {menuItem: 'Login', render: LoginForm},
                {menuItem: 'Sign up', render: SignUpForm},
              ]}
              defaultActiveIndex={defaultActiveIndex}
            />
          </Grid.Column>
        </Grid>
      </Container>
    </>
  )
}
