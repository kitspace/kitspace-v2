// TODO: import loadStripe in `Page`, and improve UI for mobile devices.
import React, { useReducer } from 'react'
import { string, number } from 'prop-types'
import { Button, Grid, Segment } from 'semantic-ui-react'
// noinspection ES6CheckImport
import { loadStripe } from '@stripe/stripe-js'

import { Total, Shipping, Quantity, ProductImage } from './elements'
import { reducer, formatTotalPrice } from './utils'
import countries from './countries.json'

const stripePromise = loadStripe('pk_test_Z1JtcYjtxxzggl4ExcHM2M29')

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

  const handleClick = async e => {
    e.preventDefault()

    // Call your backend to create the Checkout session.
    dispatch({ type: 'setLoading', payload: { loading: true } })

    // When the customer clicks on the button, redirect them to Checkout.
    const stripe = await stripePromise
    const { error } = await stripe.redirectToCheckout({
      mode: 'payment',
      lineItems: [
        { price: state.priceId, quantity: state.quantity },
        { price: state.shippingPriceId, quantity: 1 },
      ],
      successUrl: `${window.location.origin}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/buy/cancelled`,
      shippingAddressCollection: {
        allowedCountries: countries.allowedCountries,
      },
    })
    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `error.message`.
    if (error) {
      dispatch({ type: 'setError', payload: { error } })
      dispatch({ type: 'setLoading', payload: { loading: false } })
    }
  }
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
          <Button
            fluid
            primary
            role="link"
            onClick={handleClick}
            disabled={state.loading}
            content={state.loading || !state.price ? 'Loading' : 'Order'}
          />
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
