import React from 'react'
import NextHead from 'next/head'
import { string } from 'prop-types'

const Head = ({ title, description, url, ogImage }) => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title>{title}</title>
    <meta content={description} name="description" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta content={url} property="og:url" />
    <meta content={title} property="og:title" />
    <meta content={description} property="og:description" />
    <meta content={url} name="twitter:site" />
    <meta content="summary_large_image" name="twitter:card" />
    <meta content={ogImage} name="twitter:image" />
    <meta content={ogImage} property="og:image" />
    <meta content="1200" property="og:image:width" />
    <meta content="630" property="og:image:height" />
    <link
      href="/icons/apple-touch-icon.png"
      rel="apple-touch-icon"
      sizes="180x180"
    />
    <link
      href="/icons/favicon-32x32.png"
      rel="icon"
      sizes="32x32"
      type="image/png"
    />
    <link
      href="/icons/favicon-16x16.png"
      rel="icon"
      sizes="16x16"
      type="image/png"
    />
    <link href="/site.webmanifest" rel="manifest" />
    <link color="#373737" href="/icons/safari-pinned-tab.svg" rel="mask-icon" />
    <meta content="#000000" name="msapplication-TileColor" />
    <meta content="#000000" name="theme-color" />
  </NextHead>
)

Head.propTypes = {
  description: string,
  ogImage: string,
  title: string,
  url: string,
}

Head.defaultProps = {
  description: 'A site for sharing electronics projects.',
  ogImage: 'https://kitspace.org/images/logo_meta.png',
  title: 'Kitspace',
  url: 'https://kitspace.org',
}

export default Head
