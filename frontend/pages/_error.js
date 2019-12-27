import React from 'react'
import Error from 'next/error'
import Link from 'next/link'

import TitleBar from '../components/TitleBar'

const KitspaceError = ({ statusCode }) => {
  return (
    <>
      <TitleBar />
      <Error statusCode={statusCode} />
    </>
  )
}

KitspaceError.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default KitspaceError
