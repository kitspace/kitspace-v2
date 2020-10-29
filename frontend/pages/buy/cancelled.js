import React from 'react'
import { Container } from 'semantic-ui-react'
import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'


export default function CanceledPage({ user, _csrf }) {
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/buy/cancelled" />
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
          <div style={{ fontSize: '24px' }}>Your order did not go through :'(</div>
          <div style={{ marginTop: 20 }}>
            <a
              style={{ fontWeight: 'normal', color: '#555555' }}
              href="/buy/electron-detector-parts-only"
            >
              try again
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

CanceledPage.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}
