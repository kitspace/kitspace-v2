import React from 'react'

import { Page } from '../../components/Page'
import styles from './styles.module.scss'

export default function CanceledPage() {
  return (
    <Page>
      <div className={styles.wrapper}>
        <span className={styles.message}>Your order did not go through :'(</span>
        <span className={styles.retry}>
          <a className={styles.link} href="/buy/electron-detector-parts-only">
            try again
          </a>
        </span>
      </div>
    </Page>
  )
}
