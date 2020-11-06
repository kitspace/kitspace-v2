import React, { useEffect, useState } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import { Container, Dimmer, Loader } from 'semantic-ui-react'
import AuthProvider from '../contexts/AuthContext'
import { useRouter } from 'next/router'

const Content = ({ reqSignIn, reqSignOut, children }) => {
  const { push, pathname } = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = window.session?.user !== null

    if (reqSignIn && !isAuthenticated) {
      push(`/login?redirect=${pathname}`).then()
    } else if (reqSignOut && isAuthenticated) {
      push('/').then()
    } else {
      setLoading(false)
    }
  }, [loading])

  if (loading) {
    return (
      <Dimmer active inverted>
        <Loader>Loading...</Loader>
      </Dimmer>
    )
  } else {
    return <Container style={{ marginTop: 30 }}>{children}</Container>
  }
}

export const Page = props => {
  return (
    <AuthProvider>
      <Head>
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
