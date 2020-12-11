import React, { useContext, useEffect, useState } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import TitleBar from './TitleBar'
import { Container, Dimmer, Loader } from 'semantic-ui-react'
import AuthProvider from '../contexts/AuthContext'
import { useRouter } from 'next/router'

const Content = ({ reqSignIn, reqSignOut, children }) => {
  const { push } = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = window.session?.user !== null

    if (reqSignIn && !isAuthenticated) {
      push('/login').then()
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
    <>
      <Head
        description={props.head?.description}
        ogImage={props.head?.ogImage}
        ogImageWidth={props.head?.ogImageWidth}
        ogImageHeight={props.head?.ogImageHeight}
        title={props.head?.title}
        url={props.head?.url}
      >
        <title>{props.title}</title>
      </Head>
      <TitleBar />
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
