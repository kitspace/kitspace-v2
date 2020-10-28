import React, { useReducer } from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import { Container, Card, Grid, Divider, Input, Button } from 'semantic-ui-react'
import { Elements, CardElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import path from 'path'

import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import styles from './index.module.scss'

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_Z1JtcYjtxxzggl4ExcHM2M29')

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

const gitea_internal_url = 'http://gitea:3000/api/v1'

const formatPrice = ({ amount, currency, quantity }) => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (let part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  amount = zeroDecimalCurrency ? amount : amount / 100
  const total = (quantity * amount).toFixed(2)
  return numberFormat.format(total)
}

function reducer(state, action) {
  switch (action.type) {
    case 'setQuantity':
      const n = parseInt(action.payload)
      if (isNaN(n) || n < 1) {
        return state
      }
      return {
        ...state,
        quantity: n,
        price: formatPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: n,
        }),
      }
    case 'increment':
      return {
        ...state,
        quantity: state.quantity + 1,
        price: formatPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: state.quantity + 1,
        }),
      }
    case 'decrement':
      if (state.quantity - 1 < 1) {
        return state
      }
      return {
        ...state,
        quantity: state.quantity - 1,
        price: formatPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: state.quantity - 1,
        }),
      }
    case 'setLoading':
      return { ...state, loading: action.payload.loading }
    case 'setError':
      return { ...state, error: action.payload.error }
    default:
      throw new Error()
  }
}

const Checkout = () => {
  const [state, dispatch] = useReducer(reducer, {
    priceId: 'price_1GtsPCI6rpeFFqzw9sE1DgFI',
    basePrice: 1000,
    currency: 'usd',
    quantity: 1,
    price: formatPrice({
      amount: 1000,
      currency: 'usd',
      quantity: 1,
    }),
    loading: false,
    error: null,
  })

  const handleClick = async event => {
    // Call your backend to create the Checkout session.
    dispatch({ type: 'setLoading', payload: { loading: true } })
    // When the customer clicks on the button, redirect them to Checkout.
    const stripe = await stripePromise
    const { error } = await stripe.redirectToCheckout({
      mode: 'payment',
      lineItems: [{ price: state.priceId, quantity: state.quantity }],
      successUrl: `${window.location.origin}/buy/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/buy/canceled`,
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
    <div className="sr-root">
      <div className="sr-main">
        <header className="sr-header">
          <div className="sr-header__logo"></div>
        </header>
        <section className="container">
          <div>
            <h1>Electron Detector Kit</h1>
            <div className="pasha-image">
              <img
                alt="Photo of complete eletron detector"
                src="https://files.stripe.com/links/fl_test_z6eUIKztTPiPOXQHe9EgRVIk"
                style={{width: 600}}
              />
            </div>
          </div>
          <div className="quantity-setter">
            <button
              className="increment-btn"
              disabled={state.quantity === 1}
              onClick={() => dispatch({ type: 'decrement' })}
            >
              -
            </button>
            <input
              type="number"
              id="quantity-input"
              min="1"
              value={state.quantity}
              onChange={e =>
                dispatch({ type: 'setQuantity', payload: e.target.value })
              }
            />
            <button
              className="increment-btn"
              onClick={() => dispatch({ type: 'increment' })}
            >
              +
            </button>
          </div>
          <p className="sr-legal-text">Number of kits</p>

          <button role="link" onClick={handleClick} disabled={state.loading}>
            {state.loading || !state.price
              ? `Loading...`
              : `Buy for ${state.price}`}
          </button>
          <div className="sr-field-error">{state.error?.message}</div>
        </section>
      </div>
    </div>
  )
}

export default function BuyPage({ user, _csrf }) {
  const [remoteRepo, setRemoteRepo] = React.useState('')
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/buy" />
      <Container>
        <Checkout />
      </Container>
    </>
  )
}

function getSession(req) {
  let session = {}
  if (req != null && req.session) {
    session = req.session
  } else if (typeof window !== 'undefined' && window.session) {
    session = window.session
  }
  return session
}

BuyPage.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}
