import React, { useReducer } from 'react'
import Link from 'next/link'
import { Container } from 'semantic-ui-react'
import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import styles from './success.module.scss'

export default function SuccessPage({ user, _csrf }) {
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/buy/success" />
      <Container style={{ marginTop: 50, width: '100%' }}>
        <div
          style={{
            marginTop: 400,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>Thank you for your order.</div>
          <div style={{ marginTop: 20 }}>
            <a
              style={{ fontWeight: 'normal', color: '#555555' }}
              href="https://kitspace.org"
            >
              browse projects
            </a>
          </div>
        </div>
      </Container>
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

SuccessPage.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}
