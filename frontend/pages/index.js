import React from 'react'
import superagent from 'superagent'
import Link from 'next/link'

import { Page } from '../components/Page'

function Home({ name, _csrf, repos }) {
  return (
    <Page title="home">
      <ul>
        <li>
          <Link href="/buy/electron-detector">Electron Detector</Link>
        </li>
        <li>
          <Link href="/buy/electron-detector-parts-only">
            Electron Detector (parts only)
          </Link>
        </li>
      </ul>
    </Page>
  )
}

export default Home
