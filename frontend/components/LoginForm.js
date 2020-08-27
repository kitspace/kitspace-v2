import React from 'react'
import {Button, Form, Header, Segment} from 'semantic-ui-react'

import ExternalAuthProviders from './ExternalAuthProviders'

export default function () {
  return (
    <>
      <Header as="h2" textAlign="center">
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
}
