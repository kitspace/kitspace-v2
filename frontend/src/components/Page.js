import React from 'react'
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
