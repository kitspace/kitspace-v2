import React from 'react'
import Product from '../../components/product'
import { Page } from '../../components/Page'

const BuyPage = () => {
  return (
    <Page>
      <Product
        name="Electron detector"
        description="A complete kit to make your own Electron Detector."
        imgUri="https://files.stripe.com/links/fl_test_z6eUIKztTPiPOXQHe9EgRVIk"
        price={30}
        shippingPrice={10}
        projectLink="https://kitspace.org/boards/github.com/ozel/diy_particle_detector/electron-detector/"
      />
    </Page>
  )
}

export default BuyPage
