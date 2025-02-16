import React from 'react'
import styles from './index.module.scss'

type ErrorProps = {
  statusCode: number
  statusMessage?: string
}

/**
 * `Error` component used for handling errors. Derived from Next.js internal error page. Copyright (c) 2019 ZEIT, Inc. Released under MIT.
 */
const Error: React.FC<ErrorProps> = ({
  statusCode,
  statusMessage = 'An unexpected error occurred',
}) => {
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

export default Error
