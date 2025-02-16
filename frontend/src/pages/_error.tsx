import React from 'react'
import type { NextPage } from 'next'

import NavBar from '@components/NavBar'
import Head from '@components/Head'
import Error from '@components/Error'

const statusCodes = {
  400: 'Bad Request',
  404: 'This page could not be found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
} as const

interface ErrorPageProps {
  statusCode: number
}

const ErrorPage: NextPage<ErrorPageProps> = ({ statusCode }) => {
  const statusMessage = statusCodes[statusCode]

  return (
    <div style={{ maxHeight: '100vh', overflow: 'hidden' }}>
      <Head title={`${statusCode}: ${statusMessage}`} />
      <NavBar />
      <Error statusCode={statusCode} statusMessage={statusMessage} />
    </div>
  )
}
ErrorPage.getInitialProps = async ({ res, err, query }: { res?; err?; query? }) => {
  const statusCode =
    query?.staticStatusCode ?? res?.staticStatusCode ?? err?.statusCode ?? 404

  return { statusCode }
}

export default ErrorPage
