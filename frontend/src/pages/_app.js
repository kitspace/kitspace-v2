import React from 'react'
import { bool, func, object, shape, string } from 'prop-types'

import App from 'next/app'
import Head from 'next/head'
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

import AuthProvider from '@contexts/AuthContext'
import './_app.scss'

if (typeof window !== 'undefined') {
  window.plausible =
    window.plausible ||
    function () {
      window.plausible.q = window.plausible.q || []
      window.plausible.q.push(arguments)
    }
}

function KitspaceApp({ Component, pageProps, session, isStaticFallback }) {
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
    <AuthProvider initialSession={session}>
      <Head>{setStaticFallback}</Head>
      <Component {...pageProps} />
      {isStaticFallback ? <ErrorMessage /> : null}
    </AuthProvider>
  )
}

KitspaceApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext)

  const { isStaticFallback } = appContext.ctx.query
  const session =
    appContext.ctx?.req?.session ??
    JSON.parse(window?.sessionStorage.getItem('session'))

  return {
    ...appProps,
    session,
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
  session: shape({ csrf: string.isRequired, user: object }),
}

KitspaceApp.defaultProps = {
  isStaticFallback: false,
  session: null,
}

export default KitspaceApp
