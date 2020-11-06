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
import { useRouter } from 'next/router'

const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_in`

export default function () {
  const router = useRouter()

  const [form, onChange, isValid, errors, formatErrorPrompt] = useForm(SignInForm)
  const [apiResponse, setApiResponse] = useState({})

  const hasApiError = apiResponse.error != null
  const isSuccessfulLogin = apiResponse.login != null

  const submit = async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()

    if (response.ok) {
      await router.push(`${router.query.redirect ? router.query.redirect : '/'}`)
      await router.reload()
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
        negative={hasApiError}
        positive={isSuccessfulLogin}
        style={{
          display: hasApiError || isSuccessfulLogin ? 'block' : 'none',
        }}
      >
        {apiResponse.message || 'Logged in!'}
      </Message>
      <Form>
        <Segment>
          <Form.Field
            fluid
            control={Input}
            label="Username or Email"
            placeholder="Username or Email"
            name="username"
            value={form.username || ''}
            onChange={onChange}
            error={formatErrorPrompt('username')}
          />
          <Form.Field
            fluid
            control={Input}
            label="Password"
            placeholder="Password"
            type="password"
            name="password"
            value={form.password || ''}
            onChange={onChange}
            error={formatErrorPrompt('password')}
          />
          <Form.Field
            control={Checkbox}
            label="Remember ME"
            name="remember"
            onChange={onChange}
          />
          <Form.Field
            fluid
            control={Button}
            content="Login"
            color="green"
            size="large"
            onClick={submit}
            disabled={!isValid}
          />
        </Segment>
        <Segment>
          <OAuthButtons />
        </Segment>
      </Form>
    </>
  )
}
