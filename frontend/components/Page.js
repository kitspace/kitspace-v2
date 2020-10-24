import React, { useContext, useEffect } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import { Container } from 'semantic-ui-react'
import AuthProvider, { AuthContext } from '../contexts/AuthContext'
import { useRouter } from 'next/router'

const PageProxy = ({ route }) => {
  /* TODO: Figure out redirects.
  *  for protected routes either that requires `reqSignOut` or `reqSignIn`
  *  now it it only renders empty page if the access policy was violated.
  */
  const { push } = useRouter()

  useEffect(() => {
    push(route).then()
  }, [])

  return null
}

const Content = ({ reqSignIn, reqSignOut, children }) => {
  const { isAuthenticated } = useContext(AuthContext)

  return (reqSignIn && isAuthenticated) ||
    (reqSignOut && !isAuthenticated) ||
    (reqSignOut === undefined && reqSignIn === undefined) ? (
    <Container style={{ marginTop: 30 }}>{children}</Container>
  ) : null
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
      <Content reqSignIn={props.reqSignIn} reqSignOut={props.reqSignOut}>
        {props.children}
      </Content>
    </AuthProvider>
  )
}

Page.propTypes = {
  title: string,
  reqSignIn: bool,
  reqSignOut: bool,
  head: object,
}

Content.propTypes = {
  reqSignIn: bool,
  reqSignOut: bool,
}

PageProxy.propTypes = {
  route: string,
}
