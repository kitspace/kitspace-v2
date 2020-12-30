import React from 'react'
import Product from '@components/Product'
import { Page } from '@components/Page'

const BuyPage = () => {
  return (
    <Page>
      <Product
        name="Electron Detector"
        description="A complete kit to make your own Electron Detector."
        imgUri="https://files.stripe.com/links/fl_test_85nflsKKmm8PBTGZjt98zJSn"
        price={3000}
        priceId="price_1HhIbjI6rpeFFqzwRGjSR0Z2"
        shippingPrice={1500}
        shippingPriceId="price_1Hi1ItI6rpeFFqzw0Db3BgHh"
        projectLink="https://kitspace.org/boards/github.com/ozel/diy_particle_detector/electron-detector/"
      />
    </Page>
  )
}

export default BuyPage
