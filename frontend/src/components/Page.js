import React, { useEffect, useState } from 'react'
import { string, object, bool } from 'prop-types'
import { Container, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'

import Head from './Head'
import NavBar from './NavBar'
import styles from './Page.module.scss'

const Content = ({ reqSignIn, reqSignOut, contnetFullSize, children }) => {
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
    return (
      <Container className={contnetFullSize ? styles.minimalContainer : null}>
        {children}
      </Container>
    )
  }
}

export const Page = props => {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <NavBar />
      <Content {...props}>{props.children}</Content>
    </>
  )
}

Page.propTypes = {
  title: string,
  reqSignIn: bool,
  reqSignOut: bool,
  contnetFullSize: bool,
}

Content.propTypes = {
  reqSignIn: bool,
  reqSignOut: bool,
  contnetFullSize: bool,
}
