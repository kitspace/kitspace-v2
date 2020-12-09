import React, { useState } from 'react'
import { Button, Form, Header, Input, Message, Segment } from 'semantic-ui-react'

import OAuthButtons from './OAuthButtons'
import useForm from '../hooks/useForm'
import { SignUpForm } from '../models/SignUpForm'

const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_up`

export default function () {
  const { form, onChange, isValid, errors, formatErrorPrompt } = useForm(SignUpForm)
  const [apiResponse, setApiResponse] = useState({})

  const submit = async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await response.json()

    if (response.ok) {
      const { email, ActiveCodeLives } = data
      setApiResponse({ email, duration: ActiveCodeLives })
    } else {
      const { error, message } = data
      setApiResponse({
        error: error || 'API error',
        message: message || 'Something went wrong. Please, try again later.',
      })
    }
  }

  const hasApiError = apiResponse.error != null
  const isSuccessfulReg = apiResponse.duration != null

  return (
    <>
      <Header as="h2" textAlign="center">
        Create a new account
      </Header>
      <Message
        negative={hasApiError}
        positive={isSuccessfulReg}
        style={{
          display: hasApiError || isSuccessfulReg ? 'block' : 'none',
        }}
      >
        <Message.Header
          style={{
            display: isSuccessfulReg && !hasApiError ? 'block' : 'none',
          }}
        >
          Success!
        </Message.Header>
        {errors.msg ||
          apiResponse.message ||
          `The activation email has been sent to ${apiResponse.email}, it'll be available for ${apiResponse.duration}.`}
      </Message>
      <Form>
        <Segment>
          <Form.Field
            fluid
            control={Input}
            label="Username"
            placeholder="Username"
            name="username"
            value={form.username || ''}
            onChange={onChange}
            error={formatErrorPrompt('username')}
          />
          <Form.Field
            fluid
            control={Input}
            label="Email"
            placeholder="Email"
            name="email"
            value={form.email || ''}
            error={formatErrorPrompt('email')}
            onChange={onChange}
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
            fluid
            control={Button}
            content="Sign up"
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
