import React from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import { Grid, Divider, Input, Button } from 'semantic-ui-react'
import path from 'path'

import Head from '../components/Head'
import TitleBar from '../components/TitleBar'

import styles from './group-buy.module.scss'

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

const gitea_internal_url = 'http://gitea:3000/api/v1'

export default function GroupBuyPage({ user, _csrf }) {
  const [remoteRepo, setRemoteRepo] = React.useState('')
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/group-buy" />
      <div>hello</div>
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

GroupBuyPage.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}
