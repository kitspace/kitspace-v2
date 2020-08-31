import React, { useState } from 'react'
import superagent from 'superagent'
import { Button, Form, Header, Segment, Input, Message } from 'semantic-ui-react'

import ExternalAuthProviders from './ExternalAuthProviders'
import useForm from '../hooks/useForm'
import { SignInForm } from '../models/SignInForm'

// TODO: this is the right value after removing the mocking procedure.
// const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_in`
const endpoint = '/user/kitspace/sign_in'
// End of mocking code.

export default function () {
  const [form, onChange, isValid, errors] = useForm(SignInForm)
  const [apiResponse, setApiResponse] = useState({})

  const errorField = field => errors.field === field && form[field] !== undefined

  const hasFromError = form[errors.field] !== undefined
  const hasApiError = apiResponse.error !== undefined
  const isSuccessfulLogin = apiResponse.login !== undefined

  const submit = async () => {
    await superagent
      .post(endpoint)
      .send(form)
      .end((err, res) => {
        if (err) {
          setApiResponse({
            error: 'API error',
            message: 'Something went wrong. Please, try again later.',
          })
        } else {
          const { error, message, LoggedInSuccessfully } = res.body
          setApiResponse({ error, message, login: LoggedInSuccessfully })
        }
      })
  }

  return (
    <>
      <Header as="h2" textAlign="center">
        Login
      </Header>
      <Message
        negative={hasFromError || hasApiError}
        positive={isSuccessfulLogin}
        style={{
          display:
            hasFromError || hasApiError || isSuccessfulLogin ? 'block' : 'none',
        }}
      >
        {errors.msg || apiResponse.message || 'Logged in!'}
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
            Login
          </Button>
        </Segment>
        <ExternalAuthProviders />
      </Form>
    </>
  )
}
