import React, { useEffect, useState } from 'react'
import { string, bool, node } from 'prop-types'

import { Container, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import Head from './Head'
import NavBar from './NavBar'

const Content = ({ requireSignIn, requireSignOut, children }) => {
  const { push, pathname } = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = window.session?.user !== null

    if (requireSignIn && !isAuthenticated) {
      push(`/login?redirect=${pathname}`).then()
    } else if (requireSignOut && isAuthenticated) {
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

const Page = ({ title, requireSignIn, requireSignOut, children }) => (
  <>
    <Head title={title} />
    <NavBar />
    <Content requireSignIn={requireSignIn} requireSignOut={requireSignOut}>
      {children}
    </Content>
  </>
)

Page.propTypes = {
  title: string.isRequired,
  requireSignIn: bool,
  requireSignOut: bool,
  children: node.isRequired,
}

Page.defaultProps = {
  requireSignIn: false,
  requireSignOut: false,
}

Content.propTypes = {
  requireSignIn: bool.isRequired,
  requireSignOut: bool.isRequired,
  children: node.isRequired,
}

export default Page
