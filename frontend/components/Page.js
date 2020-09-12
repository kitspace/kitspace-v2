import React from 'react'
import { string } from 'prop-types'
import Head from './Head'
import TitleBar from './TitleBar'
import { Container } from 'semantic-ui-react'

export const Page = props => {
  return (
    <>
      <Head
        description={props.head?.description}
        ogImage={props.head?.ogImage}
        title={props.head?.title}
        url={props.head?.url}
      >
        <title>{props.title}</title>
      </Head>
      <TitleBar />
      <Container style={{ marginTop: 30 }}>{props.children}</Container>
    </>
  )
}

Page.propTypes = {
  title: string,
  head: Head.propTypes
}
