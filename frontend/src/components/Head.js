import React from 'react'
import NextHead from 'next/head'
import { string } from 'prop-types'

const Head = ({ title, description, url, ogImage }) => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title>{title}</title>
    <meta content={description} name="description" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <link href="/static/favicon.png" rel="icon" type="image/png" />
    <meta content={url} property="og:url" />
    <meta content={title} property="og:title" />
    <meta content={description} property="og:description" />
    <meta content={url} name="twitter:site" />
    <meta content="summary_large_image" name="twitter:card" />
    <meta content={ogImage} name="twitter:image" />
    <meta content={ogImage} property="og:image" />
    <meta content="1200" property="og:image:width" />
    <meta content="630" property="og:image:height" />
  </NextHead>
)

Head.propTypes = {
  title: string,
  description: string,
  url: string,
  ogImage: string,
}

Head.defaultProps = {
  title: 'Kitspace',
  description: 'A site for sharing electronics projects.',
  url: 'https://kitspace.org',
  ogImage: 'https://kitspace.org/images/logo_meta.png',
}

export default Head
