import React from 'react'
import { Grid, Header } from 'semantic-ui-react'
import { GithubLoginButton, TwitterLoginButton } from 'react-social-login-buttons'

import GoogleButton from './GoogleLoginButton'

export default function OAuthButtons() {
  return (
    <>
      <Header as="h3" textAlign="center">
        Or with
      </Header>
      <Grid columns={3} divided>
        <Grid.Row>
          <Grid.Column>
            <TwitterLoginButton>Twitter</TwitterLoginButton>
          </Grid.Column>
          <Grid.Column>
            <GithubLoginButton>GitHub</GithubLoginButton>
          </Grid.Column>
          <Grid.Column>
            <GoogleButton />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  )
}
