import React from 'react'

import { Page } from '../../components/Page'
import styles from './styles.module.scss'

export default function SuccessPage() {
  return (
      <Page>
        <div className={styles.wrapper}
        >
          <div className={styles.message}>Thank you for your order.</div>
          <div className={styles.retry}>
            <a
              className={styles.link}
              href="https://kitspace.org"
            >
              browse projects
            </a>
          </div>
        </div>
      </Page>
  )
}
