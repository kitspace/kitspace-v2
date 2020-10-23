import React, { useContext, useEffect } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import { Container } from 'semantic-ui-react'
import AuthProvider, { AuthContext } from '../contexts/AuthContext'
import { useRouter } from 'next/router'

const LoginPageProxy = () => {
  const { push } = useRouter()

  useEffect(() => {
    push('/login').then()
  })

  return null
}

const Content = props => {
  const { isAuthenticated } = useContext(AuthContext)
  console.log(isAuthenticated)

  if (props.reqSignIn) {
    return isAuthenticated ? (
      <Container style={{ marginTop: 30 }}>{props.children}</Container>
    ) : <LoginPageProxy />
  } else if (props.reqSignOut) {
    return !isAuthenticated ? (
      <Container style={{ marginTop: 30 }}>{props.children}</Container>
    ) : (
      <LoginPageProxy />
    )
  } else {
    return <Container style={{ marginTop: 30 }}>{props.children}</Container>
  }
}

export const Page = props => {
  return (
    <AuthProvider>
      <Head
        description={props.head?.description}
        ogImage={props.head?.ogImage}
        title={props.head?.title}
        url={props.head?.url}
      >
        <title>{props.title}</title>
      </Head>
      <NavBar />
      <Content reqSignIn={props.reqSignIn}>{props.children}</Content>
    </AuthProvider>
  )
}

Page.propTypes = {
  title: string,
  reqSignIn: bool,
  head: object,
}

Content.propTypes = {
  reqSignIn: bool,
  reqSignOut: bool,
}
