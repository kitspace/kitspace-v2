import React from 'react'
import Link from 'next/link'

import Page from '@components/Page'
import LiteYouTube from '@components/LiteYouTube'

const BomBuilder = () => (
  <Page title="BOM Builder">
    <h1 id="the-kitspace-bom-builder">The Kitspace BOM Builder</h1>
    <p>
      The BOM Builder allows you to automatically find in-stock components and
      alternatives across distributors and lets you add entire bill of materials
      directly to shopping carts by connecting up to{' '}
      <Link href="/1-click-bom">
        <a>1-click BOM</a>
      </Link>
    </p>
    <p>
      In our experience this can cut the purchasing time down from a few hours to a
      few minutes. We are now in a closed beta phase so if you are interested in
      trying it out please{' '}
      <a href="mailto:info@kitspace.org?subject=BOM%20Builder">get in touch</a>.
    </p>
    <h2 id="a-quick-demo-of-the-alpha-version">
      A quick demo of the alpha version
    </h2>
    <LiteYouTube
      videoid="m96G7B1doRQ"
      videotitle="A quick demo of the alpha version"
    />
    <h2 id="a-demo-of-all-the-features-of-the-beta-version">
      A demo of all the features of the beta version
    </h2>
    <LiteYouTube
      videoid="2poJVSSmSos"
      videotitle="A demo of all the features of the beta version"
    />
  </Page>
)

export default BomBuilder
