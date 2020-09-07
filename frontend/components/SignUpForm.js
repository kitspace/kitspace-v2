import React, { useState } from 'react'
import superagent from 'superagent'
import { Button, Form, Header, Input, Message, Segment } from 'semantic-ui-react'

import OAuthButtons from './OAuthButtons'
import useForm from '../hooks/useForm'
import { SignUpForm } from '../models/SignUpForm'

const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_up`

export default function () {
  const [form, onChange, isValid, errors, isErrorField] = useForm(SignUpForm)
  const [apiResponse, setApiResponse] = useState({})

  const submit = async () => {
    await superagent
      .post(endpoint)
      .send(form)
      .end((err, res) => {
        const { error, message, email, ActiveCodeLives } = res.body

        if (err) {
          setApiResponse({
            error: error || 'API error',
            message: message || 'Something went wrong. Please, try again later.',
          })
        } else {
          setApiResponse({ error, message, email, duration: ActiveCodeLives })
        }
      })
  }

  const hasFromError = form[errors.field] !== undefined
  const hasApiError = apiResponse.error !== undefined
  const isSuccessfulReg = apiResponse.duration !== undefined

  return (
    <>
      <Header as="h2" textAlign="center">
        Create a new account
      </Header>
      <Message
        negative={hasFromError || hasApiError}
        positive={isSuccessfulReg}
        style={{
          display:
            hasFromError || hasApiError || isSuccessfulReg ? 'block' : 'none',
        }}
      >
        <Message.Header
          style={{
            display:
              isSuccessfulReg && !(hasFromError || hasApiError) ? 'block' : 'none',
          }}
        >
          Success!
        </Message.Header>
        {errors.msg ||
          apiResponse.message ||
          `The activation email has been sent you, it'll be available for ${apiResponse.duration}.`}
      </Message>
      <Form size="large">
        <Segment stacked>
          <Input
            fluid
            placeholder="Username"
            name="username"
            value={form.username || ''}
            onChange={onChange}
            error={isErrorField('username')}
            style={{ marginBottom: 20 }}
          />
          <Input
            fluid
            placeholder="Email"
            name="email"
            value={form.email || ''}
            error={isErrorField('mail')}
            onChange={onChange}
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
        <OAuthButtons />
      </Form>
    </>
  )
}
