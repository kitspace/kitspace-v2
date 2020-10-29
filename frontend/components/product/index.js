import React, { useReducer } from 'react'
import { string, number } from 'prop-types'
import { Button, Grid, Segment } from 'semantic-ui-react'

import { Total, Shipping, Quantity, ProductImage } from './elements'
import { reducer, formatTotalPrice } from './utils'

const Product = ({
  name,
  imgUri,
  price,
  shippingPrice,
  description,
  projectLink,
}) => {
  const [state, dispatch] = useReducer(
    reducer,
    {
      priceId: 'price_1HhIbjI6rpeFFqzwRGjSR0Z2',
      basePrice: price * 100,
      currency: 'eur',
      quantity: 1,
      shippingPriceId: 'price_1HhIekI6rpeFFqzwiaMFMUXv',
      shippingPrice: shippingPrice * 100,
      price: formatTotalPrice({
        amount: price * 100,
        currency: 'eur',
        quantity: 1,
        shipping: shippingPrice * 100,
      }),
      loading: false,
      error: null,
    },
    undefined,
  )
  return (
    <Segment style={{ border: 'none', boxShadow: 'none' }}>
      <Grid columns={2}>
        <Grid.Column style={{ borderRight: 'solid #DFDFDF 1px' }}>
          <ProductImage src={imgUri} />
        </Grid.Column>
        <Grid.Column style={{ paddingLeft: '3rem' }}>
          <h2 style={{ textTransform: 'capitalize' }}>{name}</h2>
          <p>
            {description + ' '}
            See full project details{' '}
            <a href={projectLink} target="_blank">
              here.
            </a>
          </p>
          <Quantity state={state} dispatch={dispatch} />
          <Shipping
            price={10}
            deliveryDate={new Date(
              new Date().getTime() + 14 * 86400000,
            ).toLocaleDateString()}
          />
          <Total val={state.price} />
          <Button />
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

Product.propTypes = {
  name: string,
  imgUri: string,
  price: number,
  shippingPrice: number,
  description: string,
  projectLink: string,
}

export default Product
