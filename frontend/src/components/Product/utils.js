export const formatTotalPrice = ({ amount, currency, quantity, shipping }) => {
  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  })
  let parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  amount = zeroDecimalCurrency ? amount : amount / 100
  parts = numberFormat.formatToParts(shipping)
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  shipping = shipping / 100
  const total = (quantity * amount + shipping).toFixed(2)
  return numberFormat.format(Number(total))
}

export const formatPrice = ({ amount, currency, quantity }) => {
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
  return numberFormat.format(Number(total))
}

export const reducer = (state, action) => {
  switch (action.type) {
    case 'setQuantity':
      const n = parseInt(action.payload)
      if (isNaN(n) || n < 1) {
        return state
      }
      return {
        ...state,
        quantity: n,
        price: formatTotalPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: n,
          shipping: state.shippingPrice,
        }),
      }
    case 'increment':
      return {
        ...state,
        quantity: state.quantity + 1,
        price: formatTotalPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: state.quantity + 1,
          shipping: state.shippingPrice,
        }),
      }
    case 'decrement':
      if (state.quantity - 1 < 1) {
        return state
      }
      return {
        ...state,
        quantity: state.quantity - 1,
        price: formatTotalPrice({
          amount: state.basePrice,
          currency: state.currency,
          quantity: state.quantity - 1,
          shipping: state.shippingPrice,
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
