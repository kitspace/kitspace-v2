import React, { useContext, useEffect } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import { Container } from 'semantic-ui-react'
import AuthProvider, { AuthContext } from '../contexts/AuthContext'
import { useRouter } from 'next/router'

const PageProxy = ({ route }) => {
  const { push } = useRouter()

  useEffect(() => {
    push(route).then()
  })

  return null
}

const Content = ({ reqSignIn, reqSignOut, children }) => {
  const { isAuthenticated } = useContext(AuthContext)
  console.log(isAuthenticated)

  if (reqSignIn) {
    return isAuthenticated ? (
      <Container style={{ marginTop: 30 }}>{children}</Container>
    ) : (
      <PageProxy route="/login" />
    )
  } else if (reqSignOut) {
    return !isAuthenticated ? (
      <Container style={{ marginTop: 30 }}>{children}</Container>
    ) : (
      <PageProxy route="/" />
    )
  } else {
    return <Container style={{ marginTop: 30 }}>{children}</Container>
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

PageProxy.propTypes = {
  route: string,
}
