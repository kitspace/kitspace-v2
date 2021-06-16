import React, { useEffect, useState } from 'react'
import { string, bool, node } from 'prop-types'

import { Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import Head from './Head'
import NavBar from './NavBar'
import styles from './Page.module.scss'

const Content = ({ requireSignIn, requireSignOut, contentFullSize, children }) => {
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
  }, [loading, requireSignIn, requireSignOut, pathname, push])

  if (loading) {
    return (
      <Loader style={{ margin: 'auto' }} active>
        Loading...
      </Loader>
    )
  }
  return (
    <div
      className={contentFullSize ? styles.minimalContainer : styles.container}
      data-cy="page-container"
    >
      {children}
    </div>
  )
}

const Page = ({
  title,
  requireSignIn,
  requireSignOut,
  contentFullSize,
  children,
}) => (
  <>
    <Head title={title} />
    <NavBar />
    <Content
      requireSignIn={requireSignIn}
      requireSignOut={requireSignOut}
      contentFullSize={contentFullSize}
    >
      {children}
    </Content>
  </>
)

Page.propTypes = {
  title: string.isRequired,
  requireSignIn: bool,
  requireSignOut: bool,
  contentFullSize: bool,
  children: node.isRequired,
}

Page.defaultProps = {
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
