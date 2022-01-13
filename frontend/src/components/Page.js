import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { string, bool, node } from 'prop-types'

import Head from './Head'
import NavBar from './NavBar'
import styles from './Page.module.scss'
import SearchProvider from '@contexts/SearchContext'

const Content = ({ contentFullSize, children }) => {
  return <Container contentFullSize={contentFullSize}>{children}</Container>
}

const Container = ({ contentFullSize, children }) => (
  <main
    className={contentFullSize ? styles.minimalContainer : styles.container}
    data-cy="page-container"
  >
    {children}
  </main>
)

const Page = ({ title, initialQuery, contentFullSize, children }) => {
  const { asPath, pathname, replace } = useRouter()

  useEffect(() => {
    /*
     * On clicking on the login button from any page for e.g., '/1-click-bom',
     * it redirects to '/login?redirect=/1-click-bom'
     * After successful login the page must be reloaded, because cookies are injected on server-side
     * This means a request: GET /login?redirect=1-click-bom will hit the server.
     * The server will find the user is already logged in so it will redirect it to the `redirect` param in the url
     * though by rewriting the response the server can't change the url displayed in the browser accordingly. This hook fixes it.
     *
     * Why can't we redirect first then reload the page to update the cookies?
     * If the page to which we should redirect is protected behind authentication (uses `withRequireSignIn`) e.g., /settings
     * The auth-handler will find that the user isn't authenticated and will redirect to login page once again.
     */

    const browserPath = asPath.split('?')[0]
    const doesTheBrowserURLMismatchPathname = browserPath !== pathname
    if (
      doesTheBrowserURLMismatchPathname &&
      pathname !== '/login' &&
      browserPath !== '/'
    ) {
      replace(pathname, null, { shallow: true })
    }
  }, [asPath, pathname, replace])

  return (
    <SearchProvider initialQuery={initialQuery}>
      <Head title={title} />
      <NavBar />
      <Content contentFullSize={contentFullSize}>{children}</Content>
    </SearchProvider>
  )
}

Page.propTypes = {
  title: string.isRequired,
  initialQuery: string,
  contentFullSize: bool,
  children: node.isRequired,
}

Page.defaultProps = {
  initialQuery: '',
  contentFullSize: false,
}

Container.propTypes = {
  contentFullSize: bool.isRequired,
  children: node.isRequired,
}

Content.propTypes = {
  contentFullSize: bool.isRequired,
  children: node.isRequired,
}

export default Page
