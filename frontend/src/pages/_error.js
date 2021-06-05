import React from 'react'

import Head from '@components/Head'
import NavBar from '@components/NavBar'
import Error from '@components/Error'

const ErrorPage = ({ statusCode }) => (
  <div style={{ maxHeight: '100vh', overflow: 'hidden' }}>
    <Head />
    <NavBar />
    <Error statusCode={statusCode} />
  </div>
)

ErrorPage.getInitialProps = ({ res, err, query }) => {
  const statusCode = query.staticStatusCode
    ? query.staticStatusCode
    : res
    ? res.statusCode
    : err
    ? err.statusCode
    : 404
  return { statusCode }
}

export default ErrorPage
