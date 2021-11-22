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
    const doesTheBrowserURLMismatchPathname = asPath.split('?')[0] !== pathname
    if (doesTheBrowserURLMismatchPathname && pathname !== '/login') {
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
