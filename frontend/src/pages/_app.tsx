import App from 'next/app'
import getConfig from 'next/config'
import Head from 'next/head'
import { Message } from 'semantic-ui-react'
import type { AppProps } from 'next/app'

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

import SearchProvider from '@contexts/SearchContext'
import './_app.scss'

const domain = getConfig().publicRuntimeConfig.KITSPACE_DOMAIN

declare global {
  interface Window {
    isStaticFallback?: boolean
  }
}

type KitspaceAppProps = AppProps & {
  isStaticFallback?: boolean
  initialQuery?: string
}

function KitspaceApp({
  Component,
  pageProps,
  isStaticFallback = false,
  initialQuery,
}: KitspaceAppProps) {
  const staticFallbackScript = isStaticFallback ? (
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
  const plausibleScript =
    domain === 'kitspace.org' ? (
      <script
        defer
        data-domain={domain}
        src="https://plausible.io/js/script.outbound-links.js"
      />
    ) : null
  return (
    <SearchProvider initialQuery={initialQuery}>
      <Head>
        {staticFallbackScript}
        {plausibleScript}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`,
          }}
        />
      </Head>
      <Component {...pageProps} />
      {isStaticFallback ? <ErrorMessage /> : null}
    </SearchProvider>
  )
}

KitspaceApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext)

  const { isStaticFallback, q } = appContext.ctx.query

  return {
    ...appProps,
    isStaticFallback,
    initialQuery: q,
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

export default KitspaceApp
