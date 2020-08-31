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
    this.post('/user/kitspace/sign_in', (schema, request) => {
      const attrs = JSON.parse(request.requestBody)

      const prohibitedUsers = ['ProhibitedUser1', 'ProhibitedUser2']
      const inactiveAccounts = ['InactiveUser1', 'InactiveUser2']

      const isActualUser =
        schema.users.where({ username: attrs.username, password: attrs.password })
          .length !== 0

      if (prohibitedUsers.includes(attrs.username)) {
        return { error: 'Prohibited', message: 'Prohibited login.' }
      } else if (inactiveAccounts.includes(attrs.username)) {
        return { error: 'ActivationRequired', message: 'Activate your account.' }
      } else if (!isActualUser) {
        return { error: 'Not Found', message: 'Wrong username or password.' }
      } else {
        return { LoggedInSuccessfully: true }
      }
    })

    this.post('/user/kitspace/sign_up', (schema, request) => {
      const attrs = JSON.parse(request.requestBody)

      const reservedNames = ['admin', 'user'] // Not a complete list of Gitea reserved names.

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
