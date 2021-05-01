import React from 'react'

import App from 'next/app'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import { Message } from 'semantic-ui-react'

import 'semantic-ui-css/components/reset.min.css'
import 'semantic-ui-css/components/site.min.css'
import 'semantic-ui-css/components/button.min.css'
import 'semantic-ui-css/components/container.min.css'
import 'semantic-ui-css/components/divider.min.css'
import 'semantic-ui-css/components/grid.min.css'
import 'semantic-ui-css/components/icon.min.css'
import 'semantic-ui-css/components/image.min.css'
import 'semantic-ui-css/components/input.min.css'
import 'semantic-ui-css/components/menu.min.css'
import 'semantic-ui-css/components/message.min.css'
import 'semantic-ui-css/components/popup.min.css'
import 'semantic-ui-css/components/label.min.css'
import 'semantic-ui-css/components/card.min.css'
import 'semantic-ui-css/components/segment.min.css'
import 'semantic-ui-css/components/form.min.css'
import 'semantic-ui-css/components/checkbox.min.css'
import 'semantic-ui-css/components/header.min.css'
import 'semantic-ui-css/components/loader.min.css'
import 'semantic-ui-css/components/list.min.css'
import 'semantic-ui-css/components/modal.min.css'
import 'semantic-ui-css/components/dimmer.min.css'
import 'semantic-ui-css/components/table.min.css'
import 'semantic-ui-css/components/checkbox.min.css'

import './_app.scss'
import AuthProvider from '@contexts/AuthContext'

function KitspaceApp({ Component, pageProps, session, isStaticFallback }) {
  const setSession = session ? (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.session = ${JSON.stringify(session)};`,
      }}
    />
  ) : null
  const setStaticFallback = isStaticFallback ? (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.isStaticFallback = ${JSON.stringify(isStaticFallback)};`,
      }}
    />
  ) : null
  if (typeof window !== 'undefined') {
    isStaticFallback = isStaticFallback || window.isStaticFallback
  }
  return (
    <AuthProvider>
      <SWRConfig value={{}}>
        <Head>
          {setSession}
          {setStaticFallback}
        </Head>
        <Component {...pageProps} />
        {isStaticFallback ? <ErrorMessage /> : null}
      </SWRConfig>
    </AuthProvider>
  )
}

KitspaceApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext)
  const session = appContext.ctx.req ? appContext.ctx.req.session : null
  const { isStaticFallback } = appContext.ctx.query
  return { ...appProps, session, isStaticFallback }
}

function ErrorMessage() {
  return (
    <div className="errorMessage">
      <Message negative>
        <Message.Header>Server Error</Message.Header>
        <p>
          We are sorry, the site is experiencing problems. Falling back to a static
          version.
        </p>
      </Message>
    </div>
  )
}

export default KitspaceApp
