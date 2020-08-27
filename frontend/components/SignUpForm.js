import React from 'react'
import {Button, Form, Header, Segment} from 'semantic-ui-react'

import ExternalAuthProviders from './ExternalAuthProviders'

export default function () {
  return (
    <>
      <Header as="h2" textAlign="center">
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
}
