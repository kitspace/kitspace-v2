import React, { useEffect } from 'react'

import styles from './InfoBar.module.scss'

const InfoBar = ({ name, url, site, description }) => {
  // https://github.com/Jan--Henrik/CH330_Hardware -> github.com/Jan--Henrik
  const ownerText = url.split('/').slice(2, 4).join('/')
 
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
            <a href={url}>{ownerText}</a>
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
