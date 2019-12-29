import App from 'next/app'
import Head from 'next/head'

function KitspaceApp({ Component, pageProps, session }) {
  const head = session ? (
    <Head>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.session = ${JSON.stringify(session)}`,
        }}
      />
    </Head>
  ) : null
  return (
    <>
      {head}
      <Component {...pageProps} />
    </>
  )
}

KitspaceApp.getInitialProps = async appContext => {
  const appProps = await App.getInitialProps(appContext)
  const session = appContext.ctx.req ? appContext.ctx.req.session : null
  return { ...appProps, session }
}

export default KitspaceApp
