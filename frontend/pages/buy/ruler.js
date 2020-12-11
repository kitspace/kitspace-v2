import React from 'react'
import Product from '../../components/product'
import { Page } from '../../components/Page'

const BuyPage = () => {
  const projectLink =
    'https://kitspace.org/boards/github.com/ozel/diy_particle_detector/electron-detector/'
  const image = '/static/ruler.jpg'
  return (
    <Page
      head={{
        title: 'Kitspace PCB Ruler',
        ogImage: 'https://shop.kitspace.org/static/ruler_meta.jpg',
        ogImageWidth: '1200',
        ogImageHeight: '900',
        url: 'https://shop.kitspace.org/buy/ruler',
        description:
          'A shiny PCB ruler (PCB only)',
      }}
    >
      <Product
        name="Kitspace PCB Ruler"
        description={
          <>
            <p>
              A PCB design reference ruler made using Inkscape,{' '}
              <a href="https://github.com/badgeek/svg2shenzhen/">svg2shenzhen</a>{' '}
              and KiCad (v5). It's up{' '}
              <a href="https://kitspace.org/boards/github.com/kitspace/ruler/">
                on Kitspace
              </a>{' '}
              of course. This listing is for the PCB only.{' '}
            </p>
            <ul>
              <li>
                You can use it as a ruler and as a reference for footprint sizes
                when working on a PCB design.
              </li>
              <li>
                The front is a functioning circuit if you populate it. The LEDs will
                light up if you connect it via USB and press the buttons or switch
                the switch (see video below). This listing is for the PCB only. If
                you want to assemble it, you can easily buy the parts through the{' '}
                <a href="https://kitspace.org/boards/github.com/kitspace/ruler/">
                  Kitspace page
                </a>
                .{' '}
              </li>
              <li>There are also pads for testing LED polarity.</li>
              <li>
                It's in a panel to show off two different ways to attach designs
                within a panel: mouse-bites and v-score. These are indicated on the
                back as well.
              </li>
            </ul>
          </>
        }
        imgUri={image}
        price={2000}
        priceId="price_1HxA76I6rpeFFqzw1BglyJvo"
        shippingPrice={0}
        shippingName={
          'Worldwide Shipping (estimated delivery by ' +
          new Date(new Date().getTime() + 10 * 86400000).toLocaleDateString(
            undefined,
            {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            },
          ) +
          ')'
        }
      />
    </Page>
  )
}

export default BuyPage
