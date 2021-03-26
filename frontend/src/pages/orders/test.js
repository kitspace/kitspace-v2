import React, { useContext, useEffect } from 'react'
import useSWR from 'swr'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'

const credentials = 'include'
const mode = 'cors'

const fetcher = (url, initOps = {}) =>
  fetch(url, {
    method: 'GET',
    mode,
    credentials,
    ...initOps,
  }).then(r => r.json())

export const useOrders = (csrf, swrOpts = {}) => {
  const endpoint = `http://orders.kitspace.test:3000/?_csrf=${csrf}`

  const { data, error, mutate } = useSWR(csrf ? endpoint : null, fetcher, swrOpts)

  return {
    orders: data || [],
    isLoading: !(data || error),
    isError: error,
    mutate,
  }
}

const Orders = ({ repos }) => {
  const { user, csrf } = useContext(AuthContext)
  const username = user?.login || 'unknown user'
  const { orders } = useOrders(csrf)

  return (
    <Page title="orders">
      <div>Hi there {username}</div>
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </Page>
  )
}

export default Orders
