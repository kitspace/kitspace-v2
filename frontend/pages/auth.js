import React from 'react'
import { useRouter } from 'next/router'
import { Container, Grid, Tab } from 'semantic-ui-react'

import TitleBar from '../components/TitleBar'
import SignUpForm from '../components/SignUpForm'
import SignInForm from '../components/SignInForm'
import { Model, Server } from 'miragejs'


new Server({
  models: {
    user: Model,
  },
  routes() {
    this.post('/user/kitspace/sign_up', (schema, request) => {
      const attrs = JSON.parse(request.requestBody)

      const reservedNames = ['admin', 'user'] // Not a full list of Gitea reserved names.

      if (schema.users.where({ username: attrs.username }).length !== 0) {
        return { error: 'Conflict', message: 'User already exists.' }
      } else if (schema.users.where({ email: attrs.email }).length !== 0) {
        return { error: 'Conflict', message: 'Email already used.' }
      } else if (reservedNames.includes(attrs.username)) {
        return { error: 'Conflict', message: 'Name is reserved.' }
      } else {
        schema.users.create(attrs)
        return { email: attrs.email, ActiveCodeLives: '3 hours' }
      }
    })
  },
})


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
