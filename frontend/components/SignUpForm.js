import React from 'react'
import superagent from 'superagent'
import { Button, Form, Header, Segment, Input, Message } from 'semantic-ui-react'

import OAuthButtons from './OAuthButtons'
import useForm from '../hooks/useForm'
import { SignUpForm } from '../models/SignUpForm'

const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/kitspace/sign_up`


export default function () {
  const [form, onChange, isValid, errors] = useForm(SignUpForm)

  const submit = async () => {
    await superagent.post(endpoint).end((err, res) => {
      if(err) {
        console.log(err)
      } else {
        console.log(res)
      }
    })
  }

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
            error={errors.field === 'username' && form.username !== undefined}
            style={{ marginBottom: 20 }}
          />
          <Input
            fluid
            icon="mail"
            iconPosition="left"
            placeholder="email"
            name="email"
            value={form.email || ''}
            error={errors.field === 'email' && form.email !== undefined}
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
            Sign up
          </Button>
        </Segment>
        <OAuthButtons />
      </Form>
    </>
  )
}
