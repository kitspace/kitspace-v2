import React, { useReducer } from 'react'
import Link from 'next/link'
import { Container } from 'semantic-ui-react'
import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import styles from './canceled.module.scss'

export default function CanceledPage({ user, _csrf }) {
  const [remoteRepo, setRemoteRepo] = React.useState('')
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/buy/canceled" />
      <Container>Y U no give us money?</Container>
    </>
  )
}

function getSession(req) {
  let session = {}
  if (req != null && req.session) {
    session = req.session
  } else if (typeof window !== 'undefined' && window.session) {
    session = window.session
  }
  return session
}

CanceledPage.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}
