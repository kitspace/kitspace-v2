import React, { useState, useContext } from 'react'
import { func } from 'prop-types'
import { useRouter } from 'next/router'
import {
  Button,
  Form,
  Grid,
  Header,
  Input,
  Message,
  Segment,
  Tab,
} from 'semantic-ui-react'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'

import Page from '@components/Page'
import useForm from '@hooks/useForm'
import { withAlreadySignedIn } from '@utils/authHandlers'
import { getSession } from '@utils/giteaInternalApi'
import SignInFormModel from '@models/SignInForm'
import { AuthContext } from '@contexts/AuthContext'
import OAuthButtons from '@components/OAuthButtons'
import SignUpFormModel from '@models/SignUpForm'
import styles from './index.module.scss'

const { KITSPACE_GITEA_URL } = getConfig().publicRuntimeConfig

const Login = () => {
  const [openPane, setOpenPane] = useState(0)
  const handlePaneChange = e => setOpenPane(e.target.value)

  return (
    <Page title="Kitspace | Login">
      <Grid
        data-cy="login-grid"
        style={{ maxWidth: '500px', margin: 'auto' }}
        verticalAlign="middle"
      >
        <Grid.Column>
          <Tab
            activeIndex={openPane}
            panes={[
              {
                menuItem: 'Sign up',
                render: function FirstPane() {
                  return <SignUpForm openLoginPane={() => setOpenPane(1)} />
                },
              },
              {
                menuItem: 'Login',
                render: function SecondPane() {
                  return <SignInForm />
                },
              },
            ]}
            onTabChange={handlePaneChange}
          />
        </Grid.Column>
      </Grid>
    </Page>
  )
}

export const getServerSideProps = withAlreadySignedIn

const SignInForm = () => {
  const endpoint = `${KITSPACE_GITEA_URL}/user/kitspace/sign_in`

  const { push, query } = useRouter()
  const { setUser, setCsrf, setApiToken } = useContext(AuthContext)

  const { form, onChange, onBlur, isValid, formatErrorPrompt } = useForm(
    SignInFormModel,
    true,
  )
  const [apiResponse, setApiResponse] = useState({})

  const hasApiError = apiResponse.error != null
  const isSuccessfulLogin = apiResponse.login != null

  const submit = async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        remember: true, // remember the user by default
      }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = await response.json()

    if (response.ok && data.user) {
      setUser(data.user)
      const session = await getSession()
      setApiToken(session.ApiToken)
      setCsrf(session.csrf)
      push(query.redirect || '/')
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
        Login
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
            required
            control={Input}
            error={formatErrorPrompt('username')}
            label="Username or Email"
            name="username"
            placeholder="Username or Email"
            value={form.username || ''}
            onBlur={onBlur}
            onChange={onChange}
          />
          <Form.Field
            fluid
            required
            control={Input}
            error={formatErrorPrompt('password')}
            label="Password"
            name="password"
            placeholder="Password"
            type="password"
            value={form.password || ''}
            onBlur={onBlur}
            onChange={onChange}
          />
          <Form.Field
            fluid
            color="green"
            content="Login"
            control={Button}
            disabled={!isValid}
            size="large"
            onClick={submit}
          />
        </Segment>
        <Segment>
          <OAuthButtons />
        </Segment>
      </Form>
    </>
  )
}

const SignUpForm = ({ openLoginPane }) => {
  const endpoint = `${KITSPACE_GITEA_URL}/user/kitspace/sign_up`

  const { setUser, setCsrf, setApiToken } = useContext(AuthContext)
  const { form, onChange, onBlur, isValid, errors, formatErrorPrompt } = useForm(
    SignUpFormModel,
    true,
  )
  const [apiResponse, setApiResponse] = useState({})
  const { push, query } = useRouter()

  const submit = async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    const data = await response.json()

    if (response.ok && data.user) {
      setUser(data.user)
      const session = await getSession()
      setApiToken(session.ApiToken)
      setCsrf(session.csrf)
      push(query.redirect || '/')
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
            required
            control={Input}
            error={formatErrorPrompt('username')}
            label="Username"
            name="username"
            placeholder="Username"
            value={form.username || ''}
            onBlur={onBlur}
            onChange={onChange}
          />
          <Form.Field
            fluid
            required
            control={Input}
            error={formatErrorPrompt('email')}
            label="Email"
            name="email"
            placeholder="Email"
            value={form.email || ''}
            onBlur={onBlur}
            onChange={onChange}
          />
          <Form.Field
            fluid
            required
            control={Input}
            error={formatErrorPrompt('password')}
            label="Password"
            name="password"
            placeholder="Password"
            type="password"
            value={form.password || ''}
            onBlur={onBlur}
            onChange={onChange}
          />
          <Form.Field
            fluid
            color="green"
            content="Sign up"
            control={Button}
            disabled={!isValid}
            size="large"
            onClick={submit}
          />
          <Form.Field
            as="a"
            className={styles.loginInstead}
            data-cy="log-in-here"
            label="Already have an account? Log in here."
            onClick={openLoginPane}
          />
        </Segment>
        <Segment>
          <OAuthButtons />
        </Segment>
      </Form>
    </>
  )
}

SignUpForm.propTypes = {
  openLoginPane: func,
}

export default Login
