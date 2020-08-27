import App from 'next/app'
import Head from 'next/head'
import { Message } from 'semantic-ui-react'

import 'semantic-ui-css/components/reset.css'
import 'semantic-ui-css/components/site.css'

import 'semantic-ui-css/components/button.css'
import 'semantic-ui-css/components/container.css'
import 'semantic-ui-css/components/divider.css'
import 'semantic-ui-css/components/grid.css'
import 'semantic-ui-css/components/icon.css'
import 'semantic-ui-css/components/image.css'
import 'semantic-ui-css/components/input.css'
import 'semantic-ui-css/components/menu.css'
import 'semantic-ui-css/components/message.css'
import 'semantic-ui-css/components/popup.css'
import 'semantic-ui-css/components/card.css'

import './_app.scss'

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
    <>
      <Head>
        {setSession}
        {setStaticFallback}}
      </Head>
      <Component {...pageProps} />
      {isStaticFallback ? <ErrorMessage /> : null}
    </>
  )
}

KitspaceApp.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext)
  const session = appContext.ctx.req ? appContext.ctx.req.session : null
  const { isStaticFallback } = appContext.ctx.query
  return { ...appProps, session, isStaticFallback }
}

function ErrorMessage() {
  return (
    <div class="errorMessage">
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
