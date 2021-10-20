// TODO: import loadStripe in `Page`
import React, { useReducer } from 'react'
import { string, number } from 'prop-types'
import { Button } from 'semantic-ui-react'
// noinspection ES6CheckImport
import { loadStripe } from '@stripe/stripe-js'

import { Total, Quantity, ProductImage } from './elements'
import { reducer, formatTotalPrice, formatPrice } from './utils'
import countries from './countries.json'
import styles from './style.module.scss'

const stripePromise = loadStripe('pk_live_jYJD5bwTmzCMJuIKwK9rIIpk')

const Product = ({
  name,
  imgUri,
  priceId,
  price,
  shippingName,
  shippingPrice,
  shippingPriceId,
  description,
  projectLink,
}) => {
  const [state, dispatch] = useReducer(
    reducer,
    {
      priceId,
      basePrice: price,
      currency: 'eur',
      quantity: 1,
      shippingPriceId,
      shippingPrice,
      price: formatTotalPrice({
        amount: price,
        currency: 'eur',
        quantity: 1,
        shipping: shippingPrice,
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
    const lineItems = [{ price: state.priceId, quantity: state.quantity }]
    if (state.shippingPriceId != null) {
      lineItems.push({ price: state.shippingPriceId, quantity: 1 })
    }
    const { error } = await stripe.redirectToCheckout({
      mode: 'payment',
      lineItems,
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
    <div className={styles.product__grid}>
      <div className={styles.product__divider}>
        <ProductImage src={imgUri} />
      </div>
      <div className={styles.product__details}>
        <h2 className={styles.product__title}>{name}</h2>
        {description}
        <Quantity state={state} dispatch={dispatch} />
        <div className={styles.shipping}>
          <div>
            <span>{shippingName}</span>
          </div>
          <span className={styles.shipping__cost}>
            {formatPrice({
              amount: shippingPrice,
              currency: 'eur',
              quantity: 1,
            })}
          </span>
        </div>
        <Total val={state.price} />
        <Button
          disabled={true}
          fluid
          primary
          role="link"
          content="Out of stock"
        />
        <div style={{marginTop:10}} >
        <a href="https://kitspace.org/newsletter/">Sign up to the newsletter</a> to be notified of new stock.
        </div>
      </div>
    </div>
  )
}

Product.propTypes = {
  name: string,
  imgUri: string,
  price: number,
  priceId: string,
  shippingPrice: number,
  shippingPriceId: string,
  shippingName: string,
  description: string,
}

export default Product
