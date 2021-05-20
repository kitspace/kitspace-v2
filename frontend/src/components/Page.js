import React, { useEffect, useState } from 'react'
import { string, bool } from 'prop-types'
import { Container, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'

import Head from './Head'
import NavBar from './NavBar'
import styles from './Page.module.scss'

const Content = ({ requireSignIn, requireSignOut, contentFullSize, children }) => {
  const { replace, pathname } = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = window.session?.user !== null

    if (requireSignIn && !isAuthenticated) {
      replace(`/login?redirect=${pathname}`).then()
    } else if (requireSignOut && isAuthenticated) {
      replace('/').then()
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
      <Container
        className={contentFullSize ? styles.minimalContainer : null}
        style={{ marginTop: '2rem' }}
      >
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
  contentFullSize: bool,
}

Content.propTypes = {
  requireSignIn: bool,
  requireSignOut: bool,
  contentFullSize: bool,
}
