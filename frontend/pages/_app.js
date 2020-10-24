import App from 'next/app'
import Head from 'next/head'
import { Message } from 'semantic-ui-react'

import 'semantic-ui-css/semantic.min.css'

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

KitspaceApp.getInitialProps = async appContext => {
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
