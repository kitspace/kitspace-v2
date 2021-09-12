import React from 'react'
import { number } from 'prop-types'

import Head from '@components/Head'
import NavBar from '@components/NavBar'
import Error from '@components/Error'

export const getServerSideProps = ({ res, err, query }) => {
  const statusCode =
    query?.staticStatusCode ?? res?.staticStatusCode ?? err?.statusCode ?? 404

  return { props: { statusCode } }
}

const ErrorPage = ({ statusCode }) => (
  <div style={{ maxHeight: '100vh', overflow: 'hidden' }}>
    <Head />
    <NavBar />
    <Error statusCode={statusCode} />
  </div>
)

ErrorPage.propTypes = {
  statusCode: number.isRequired,
}

export default ErrorPage
