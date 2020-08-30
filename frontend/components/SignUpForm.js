import React from 'react'
import superagent from 'superagent'
import { Button, Form, Header, Input, Message, Segment } from 'semantic-ui-react'

import ExternalAuthProviders from './ExternalAuthProviders'
import useForm from '../hooks/useForm'
import { SignUpForm } from '../models/SignUpForm'

import { Model, Server } from 'miragejs'

// TODO: this is the right value after removing the mocking procedure.
// const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_up`


// This part for mocking until we get the backend right!
const endpoint = '/user/kitspace/sign_up'

new Server({
  models: {
    user: Model,
  },
  routes() {

    this.post(endpoint, (schema, request) => {
      const attrs = JSON.parse(request.requestBody)

      const reservedNames = ['admin', 'user']  // Not a full list of Gitea reserved names
      if (schema.users.where({ 'username': attrs.username }).length !== 0) {
        return { error: 'Conflict', message: 'User already exists.' }
      } else if (schema.users.where({ 'email': attrs.email }).length !== 0) {
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
// End of mocking code.


export default function() {
  const [form, onChange, isValid, errors] = useForm(SignUpForm)

  const submit = async () => {
    await superagent.post(endpoint).send(form).end((err, res) => {
      if (err) {
        console.log(err)
      } else {
        console.log(res.body)
      }
    })
  }

  const errorField = field => errors.field === field && form[field] !== undefined

  return (
    <>
      <Header as="h2" textAlign="center">
        Create a new account
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
            error={errorField('username')}
            style={{ marginBottom: 20 }}
          />
          <Input
            fluid
            icon="mail"
            iconPosition="left"
            placeholder="email"
            name="email"
            value={form.email || ''}
            error={errorField('mail')}
            onChange={onChange}
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
            error={errorField('password')}
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
            Sign up
          </Button>
        </Segment>
        <ExternalAuthProviders/>
      </Form>
    </>
  )
}
