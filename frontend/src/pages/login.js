import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Checkbox,
  Form,
  Grid,
  Header,
  Input,
  Message,
  Segment,
  Tab,
} from 'semantic-ui-react'
import { isEmpty } from 'lodash'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
import SignInFormModel from '@models/SignInForm'
import OAuthButtons from '@components/OAuthButtons'
import SignUpFormModel from '@models/SignUpForm'

const Login = () => {
  const [openPane, setOpenPane] = useState(1)
  const { query } = useRouter()

  useEffect(() => {
    if (query.hasOwnProperty('sign_up')) {
      setOpenPane(0)
    } else {
      setOpenPane(1)
    }
  }, [query])

  return (
    <Page title="login" requireSignOut>
      <Grid style={{ maxWidth: '500px', margin: 'auto' }} verticalAlign="middle">
        <Grid.Column>
          <Tab
            panes={[
              {
                menuItem: 'Sign up',
                render: function SignUpTab() {
                  return <SignUpForm />
                },
              },
              {
                menuItem: 'Log in',
                render: function SignInTab() {
                  return <SignInForm />
                },
              },
            ]}
            defaultActiveIndex={openPane}
          />
        </Grid.Column>
      </Grid>
    </Page>
  )
}

const SignInForm = () => {
  const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_in`

  const router = useRouter()

  const { form, onChange, isValid, formatErrorPrompt } = useForm(SignInFormModel)
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
            label="Remember me"
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

const SignUpForm = () => {
  const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_up`

  const { form, onChange, isValid, errors, formatErrorPrompt } =
    useForm(SignUpFormModel)
  const [apiResponse, setApiResponse] = useState({})
  const { reload } = useRouter()

  const autoSignIn = async (username, password) => {
    const signInEndpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_in`
    const response = await fetch(signInEndpoint, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    if (response.ok) {
      await reload()
    } else {
      console.error('Failed to auto sign in the user.')
    }
  }

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
      await autoSignIn(form.username, form.password)
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
          display: hasApiError && isEmpty(errors) ? 'block' : 'none',
        }}
      >
        {errors.msg || apiResponse.message}
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

export default Login
