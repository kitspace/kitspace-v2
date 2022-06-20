import React from 'react'
import { number, string } from 'prop-types'

import styles from './index.module.scss'

/**
 * `Error` component used for handling errors. Derived from Next.js internal error page. Copyright (c) 2019 ZEIT, Inc. Released under MIT.
 */
const Error = ({ statusCode, statusMessage }) => {
  return (
    <div className={styles.error}>
      <div>
        {statusCode ? <h1 className={styles.heading}>{statusCode}</h1> : null}
        <div className={styles.desc}>
          <h2 className={styles.title} data-cy="status-message">
            {statusMessage}.
          </h2>
        </div>
      </div>
    </div>
  )
}

Error.propTypes = {
  statusCode: number.isRequired,
  statusMessage: string.isRequired,
}

Error.defaultProps = {
  title: 'An unexpected error has occurred',
}

export default Error
