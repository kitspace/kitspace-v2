import React, { useEffect, useState } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import { Container, Loader } from 'semantic-ui-react'
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
      <Loader style={{ margin: 'auto' }} active>
        Loading...
      </Loader>
    )
  } else {
    return <Container style={{ marginTop: 30 }}>{children}</Container>
  }
}

export const Page = props => {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <NavBar />
      <Content reqSignIn={props.reqSignIn} reqSignOut={props.reqSignOut}>
        {props.children}
      </Content>
    </>
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
