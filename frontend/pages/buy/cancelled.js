import React from 'react'

import { Page } from '../../components/Page'
import styles from './styles.module.scss'

export default function CanceledPage() {
  return (
    <Page>
      <div className={styles.wrapper}>
        <span className={styles.message}>Your order did not go through :'(</span>
      </div>
    </Page>
  )
}
