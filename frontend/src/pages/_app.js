import '../wdyr'
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
import 'semantic-ui-css/components/progress.min.css'

import './_app.scss'
import AuthProvider from '@contexts/AuthContext'
import { bool, func, object } from 'prop-types'

function KitspaceApp({
  Component,
  pageProps,
  serverSideSession,
  clientSideSession,
  isStaticFallback,
}) {
  const setSession = serverSideSession ? (
    <script
      // using dangerouslySetInnerHTML to avoid browser parsing errors
      // (could be that these only happen in development mode)
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `window.session = ${JSON.stringify(serverSideSession)};`,
      }}
    />
  ) : null
  const setStaticFallback = isStaticFallback ? (
    <script
      // using dangerouslySetInnerHTML to avoid browser parsing errors
      // (could be that these only happen in development mode)
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `window.isStaticFallback = ${JSON.stringify(isStaticFallback)};`,
      }}
    />
  ) : null
  if (typeof window !== 'undefined') {
    isStaticFallback = isStaticFallback || window.isStaticFallback
  }
  return (
    <AuthProvider
      initialCsrf={serverSideSession?.csrf || clientSideSession?.csrf}
      initialUser={serverSideSession?.user || clientSideSession?.user}
    >
      <SWRConfig value={{}}>
        <Head>
          {setSession}
          {setStaticFallback}
          <script>
            {
              'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }'
            }
          </script>
        </Head>
        <Component {...pageProps} />
        {isStaticFallback ? <ErrorMessage /> : null}
      </SWRConfig>
    </AuthProvider>
  )
}

KitspaceApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext)
  let serverSideSession
  let clientSideSession
  if (appContext.ctx.req != null) {
    serverSideSession = appContext.ctx.req.session
  } else if (typeof window !== 'undefined') {
    clientSideSession = window.session
  }
  const { isStaticFallback } = appContext.ctx.query
  return {
    ...appProps,
    serverSideSession,
    clientSideSession,
    isStaticFallback,
  }
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

KitspaceApp.propTypes = {
  Component: func.isRequired,
  pageProps: object.isRequired,
  isStaticFallback: bool,
  serverSideSession: object,
  clientSideSession: object,
}

KitspaceApp.defaultProps = {
  isStaticFallback: false,
  session: null,
}

export default KitspaceApp
