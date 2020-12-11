import React, { useContext, useEffect, useState } from 'react'
import { string, object, bool } from 'prop-types'

import Head from './Head'
import TitleBar from './TitleBar'
import { Container } from 'semantic-ui-react'
import AuthProvider from '../contexts/AuthContext'
import { useRouter } from 'next/router'

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
      <Container>{props.children}</Container>
    </>
  )
}

Page.propTypes = {
  title: string,
  reqSignIn: bool,
  reqSignOut: bool,
  head: object,
}
