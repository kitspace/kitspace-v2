import React from 'react'
import {useRouter} from 'next/router'
import {
  Button,
  Container,
  Form,
  Grid,
  Header,
  Segment,
  Tab,
} from 'semantic-ui-react'

import TitleBar from '../components/TitleBar'
import ExternalAuthProviders from '../components/ExternalAuthProviders'

const panes = [
  {
    menuItem: 'Login',
    render: () => {
      return (
        <>
          <Header as="h2" color="teal" textAlign="center">
            Login
          </Header>
          <Form size="large">
            <Segment stacked>
              <Form.Input
                fluid
                icon="user"
                iconPosition="left"
                placeholder="username"
                style={{marginBottom: 20}}
              />
              <Form.Input
                fluid
                icon="lock"
                iconPosition="left"
                placeholder="Password"
                type="password"
                style={{marginBottom: 20}}
              />

              <Button color="green" fluid size="large">
                Login
              </Button>
            </Segment>
          </Form>
          <ExternalAuthProviders />
        </>
      )
    },
  },
  {
    menuItem: 'Sign up',
    render: () => {
      return (
        <>
          <Header as="h2" color="teal" textAlign="center">
            Create a new account
          </Header>
          <Form size="large">
            <Segment stacked>
              <Form.Input
                fluid
                icon="user"
                iconPosition="left"
                placeholder="username"
                style={{marginBottom: 20}}
              />
            </Segment>
            <Segment stacked>
              <Form.Input
                fluid
                icon="mail"
                iconPosition="left"
                placeholder="email"
                style={{marginBottom: 20}}
              />
              <Form.Input
                fluid
                icon="lock"
                iconPosition="left"
                placeholder="Password"
                type="password"
                style={{marginBottom: 20}}
              />
              <Button color="green" fluid size="large">
                Sign up
              </Button>
            </Segment>
            <ExternalAuthProviders />
          </Form>
        </>
      )
    },
  },
]

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
      <TitleBar route="/auth/" auth/>
      <Container style={{marginTop: 30}}>
        <Grid textAlign="center" verticalAlign="middle">
          <Grid.Column style={{maxWidth: 450}}>
            <Tab panes={panes} defaultActiveIndex={defaultActiveIndex} />
          </Grid.Column>
        </Grid>
      </Container>
    </>
  )
}
