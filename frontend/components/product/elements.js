import React from 'react'
import { Button, Image, Input } from 'semantic-ui-react'

import { formatPrice } from './utils'

export const ProductImage = ({ src }) => {
  return <Image src={src} fluid />
}

export const Total = ({ val }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        marginBottom: '1rem',
      }}
    >
      <b>Total: </b>
      <b>{val}</b>
    </div>
  )
}

export const Shipping = ({ deliveryDate, price }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 'solid #DFDFDF 1px',
        paddingBottom: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div>
        <span>Shipping (Europe)</span>
        <span style={{ display: 'block', textEmphasis: 'italic', color: 'grey' }}>
          delivered by {deliveryDate}
        </span>
      </div>
      <span style={{ display: 'block' }}>
        {formatPrice({
          amount: price * 100,
          currency: 'eur',
          quantity: 1,
        })}
      </span>
    </div>
  )
}

export const Quantity = ({ state, dispatch }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 'solid #DFDFDF 1px',
        paddingBottom: '1rem',
        marginBottom: '1rem',
      }}
    >
      <span style={{ display: 'block', paddingRight: '1rem' }}>Quantity:</span>
      <div style={{ display: 'inline-flex' }}>
        <Button
          basic
          className="increment-btn"
          onClick={() => dispatch({ type: 'decrement' })}
        >
          -
        </Button>
        <Input
          style={{ width: 100, marginLeft: 10, marginRight: 10 }}
          size="mini"
          type="number"
          id="quantity-input"
          min="1"
          value={state.quantity}
          onChange={e => dispatch({ type: 'setQuantity', payload: e.target.value })}
        />
        <Button
          basic
          className="increment-btn"
          onClick={() => dispatch({ type: 'increment' })}
        >
          +
        </Button>
      </div>
      <p style={{ display: 'inline', paddingLeft: '1rem' }}>
        {formatPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: state.quantity,
        })}
      </p>
    </div>
  )
}
