import React from 'react'
import NextHead from 'next/head'

type HeadProps = {
  title?: string
  ogDescription?: string
  url?: string
  ogImage?: string
}

const Head = ({
  title = 'Kitspace',
  ogDescription = 'A site for sharing electronics projects.',
  url = 'https://kitspace.org',
  ogImage = 'https://kitspace.org/static/images/logo_meta.png',
}: HeadProps) => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title>{title}</title>
    <meta content={ogDescription} name="description" />
    <meta content="width=device-width, initial-scale=1" name="viewport" />
    <meta content={url} property="og:url" />
    <meta content={title} property="og:title" />
    <meta content={ogDescription} property="og:description" />
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
      href="/icons/favicon-96x96.png"
      rel="icon"
      sizes="96x96"
      type="image/png"
    />
    <link
      href="/icons/favicon-48x48.png"
      rel="icon"
      sizes="48x48"
      type="image/png"
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

export default Head
