import React from 'react'
import Head from 'next/head'
import { number, string } from 'prop-types'

import styles from './Error.module.scss'

const statusCodes = {
  400: 'Bad Request',
  404: 'This page could not be found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
}
/**
 * `Error` component used for handling errors. Derived from Next.js internal error page. Copyright (c) 2019 ZEIT, Inc. Released under MIT.
 */
const Error = ({ statusCode, title }) => (
  <div className={styles.error}>
    <Head>
      <title>
        {statusCode}: {title || statusCodes[statusCode]}
      </title>
    </Head>
    <div>
      <style dangerouslySetInnerHTML={{ __html: 'body { margin: 0 }' }} />
      {statusCode ? <h1 className={styles.heading}>{statusCode}</h1> : null}
      <div className={styles.desc}>
        <h2 className={styles.title}>{title}.</h2>
      </div>
    </div>
  </div>
)

Error.propTypes = {
  statusCode: number.isRequired,
  title: string,
}

Error.defaultProps = {
  title: 'An unexpected error has occurred',
}

export default Error
