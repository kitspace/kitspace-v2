import React from 'react'

import styles from './InfoBar.module.scss'

const InfoBar = ({ name, url, site, description }) => {
  const siteCom = site ? (
    <span>
      {'  |  '}
      <a href={site}>homepage</a>
    </span>
  ) : null

  return (
    <div className={styles.infoBar}>
      <div className={styles.infoBarInner}>
        <div className={styles.infoBarTitle}>
          <div className={styles.titleText}>{name}</div>
          <div className={styles.subtitleText}>
            <a href={url}>{url}</a>
            {siteCom}
          </div>
        </div>
        <div className={styles.infoBarTitle}>
          <div className={styles.infoBarSummary}>{description}</div>
        </div>
      </div>
    </div>
  )
}

export default InfoBar
