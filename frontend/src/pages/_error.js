import React from 'react'
import { number } from 'prop-types'

import NavBar from '@components/NavBar'
import Error from '@components/Error'

const ErrorPage = ({ statusCode }) => (
  <div style={{ maxHeight: '100vh', overflow: 'hidden' }}>
    <NavBar />
    <Error statusCode={statusCode} />
  </div>
)

ErrorPage.getInitialProps = ({ res, err, query }) => {
  const statusCode =
    query?.staticStatusCode ?? res?.staticStatusCode ?? err?.statusCode ?? 404

  return { statusCode }
}

ErrorPage.propTypes = {
  statusCode: number.isRequired,
}

export default ErrorPage
