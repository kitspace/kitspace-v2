import React from 'react'
import { Button, Form, Header, Segment, Input, Message } from 'semantic-ui-react'

import ExternalAuthProviders from './ExternalAuthProviders'
import useForm from '../hooks/useForm'
import { SignInForm } from '../models/SignInForm'

export default function () {
  const [form, onChange, isValid, errors] = useForm(SignInForm)

  const submit = () => {
    console.log(form)
  }

  return (
    <>
      <Header as="h2" textAlign="center">
        Login
      </Header>
      <Message
        negative
        style={{ display: form[errors.field] === undefined ? 'none' : 'block' }}
      >
        {errors.msg}
      </Message>
      <Form size="large">
        <Segment stacked>
          <Input
            fluid
            icon="user"
            iconPosition="left"
            placeholder="username"
            name="username"
            value={form.username || ''}
            onChange={onChange}
            error={errors.field === 'username' && form.username !== undefined}
            style={{ marginBottom: 20 }}
          />
          <Input
            fluid
            icon="lock"
            iconPosition="left"
            placeholder="Password"
            type="password"
            name="password"
            value={form.password || ''}
            onChange={onChange}
            error={errors.field === 'password' && form.password !== undefined}
            style={{ marginBottom: 20 }}
          />
        </Segment>
        <Segment>
          <Button
            fluid
            color="green"
            size="large"
            onClick={submit}
            disabled={!isValid}
          >
            Login
          </Button>
        </Segment>
        <ExternalAuthProviders />
      </Form>
    </>
  )
}
