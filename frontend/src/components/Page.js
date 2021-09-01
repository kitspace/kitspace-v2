import React, { useContext, useEffect, useState } from 'react'
import { string, bool, node } from 'prop-types'
import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'

import { AuthContext } from '@contexts/AuthContext'

import Head from './Head'
import NavBar from './NavBar'
import styles from './Page.module.scss'
import SearchProvider from '@contexts/SearchContext'

const Content = ({ requireSignIn, requireSignOut, contentFullSize, children }) => {
  const { pathname, replace } = useRouter()
  const [loading, setLoading] = useState(true)
  const [throttledLoader, setThrottledLoader] = useState(false)
  const { isAuthenticated } = useContext(AuthContext)

  useEffect(() => {
    setTimeout(() => {
      setThrottledLoader(true)
    }, 200)
  }, [])

  useEffect(() => {
    const isAuthenticated = window?.session.user != null

    if (requireSignIn && !isAuthenticated) {
      replace(`/login?redirect=${pathname}`)
    } else if (requireSignOut && isAuthenticated) {
      replace('/')
    } else {
      setLoading(false)
    }
  }, [loading, requireSignIn, requireSignOut, pathname, isAuthenticated, replace])

  const isPublicPath = !(requireSignIn || requireSignOut)
  if (isPublicPath) {
    // render the page immediately without checking the authentication status.
    return <Container contentFullSize={contentFullSize}>{children}</Container>
  }

  if (loading && throttledLoader) {
    return (
      <Loader style={{ margin: 'auto' }} active>
        Loading...
      </Loader>
    )
  }

  return throttledLoader ? (
    <Container contentFullSize={contentFullSize}>{children}</Container>
  ) : null
}

const Container = ({ contentFullSize, children }) => (
  <main
    data-cy="page-container"
    className={contentFullSize ? styles.minimalContainer : styles.container}
  >
    {children}
  </main>
)

const Page = ({
  title,
  initialQuery,
  requireSignIn,
  requireSignOut,
  contentFullSize,
  children,
}) => (
  <SearchProvider initialQuery={initialQuery}>
    <Head title={title} />
    <NavBar />
    <Content
      requireSignIn={requireSignIn}
      requireSignOut={requireSignOut}
      contentFullSize={contentFullSize}
    >
      {children}
    </Content>
  </SearchProvider>
)

Page.propTypes = {
  title: string.isRequired,
  initialQuery: string,
  requireSignIn: bool,
  requireSignOut: bool,
  contentFullSize: bool,
  children: node.isRequired,
}

Page.defaultProps = {
  initialQuery: '',
  requireSignIn: false,
  requireSignOut: false,
  contentFullSize: false,
}

Content.propTypes = {
  requireSignIn: bool.isRequired,
  requireSignOut: bool.isRequired,
  contentFullSize: bool.isRequired,
  children: node.isRequired,
}

export default Page
