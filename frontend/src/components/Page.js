import React, { useEffect, useState } from 'react'
import { string, bool, node } from 'prop-types'

import { Container, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import Head from './Head'
import NavBar from './NavBar'

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
  }
  return <Container style={{ marginTop: 30 }}>{children}</Container>
}

const Page = ({ title, reqSignIn, reqSignOut, children }) => (
  <>
    <Head>
      <title>{title}</title>
    </Head>
    <NavBar />
    <Content reqSignIn={reqSignIn} reqSignOut={reqSignOut}>
      {children}
    </Content>
  </>
)

Page.propTypes = {
  title: string.isRequired,
  reqSignIn: bool.isRequired,
  reqSignOut: bool.isRequired,
  children: node.isRequired,
}

Content.propTypes = {
  reqSignIn: bool.isRequired,
  reqSignOut: bool.isRequired,
  children: node.isRequired,
}

export default Page
