import React, { useState } from 'react'
import {
  Button,
  Form,
  Header,
  Segment,
  Input,
  Message,
  Checkbox,
} from 'semantic-ui-react'

import OAuthButtons from './OAuthButtons'
import useForm from '../hooks/useForm'
import { SignInForm } from '../models/SignInForm'

const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_in`

export default function () {
  const [form, onChange, isValid, errors, isErrorField] = useForm(SignInForm)
  const [apiResponse, setApiResponse] = useState({})

  const hasFromError = form[errors.field] !== undefined
  const hasApiError = apiResponse.error !== undefined
  const isSuccessfulLogin = apiResponse.login !== undefined

  const submit = async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()

    if (response.ok) {
      const { LoggedInSuccessfully } = data
      setApiResponse({ login: LoggedInSuccessfully })
    } else {
      const { error, message } = data
      setApiResponse({
        error: error || 'API error',
        message: message || 'Something went wrong. Please, try again later.',
      })
    }
  }

  return (
    <>
      <Header as="h2" textAlign="center">
        Log in
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
            placeholder="Username or Email"
            name="username"
            value={form.username || ''}
            onChange={onChange}
            error={isErrorField('username')}
            style={{ marginBottom: 20 }}
          />
          <Input
            fluid
            placeholder="Password"
            type="password"
            name="password"
            value={form.password || ''}
            onChange={onChange}
            error={isErrorField('password')}
            style={{ marginBottom: 20 }}
          />
        </Segment>
        <Checkbox label="Remember Me" name="remember" onChange={onChange} />
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
        <OAuthButtons />
      </Form>
    </>
  )
}
