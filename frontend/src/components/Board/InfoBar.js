import React from 'react'
import { string } from 'prop-types'

import styles from './InfoBar.module.scss'

const InfoBar = ({ name, originalUrl, site, description }) => {
  // https://github.com/Jan--Henrik/CH330_Hardware -> github.com/Jan--Henrik
  const ownerText = originalUrl?.split('/').slice(2, 4).join('/')

  const siteCom = site ? (
    <span>
      {'  |  '}
      <a href={site} rel="noopener noreferrer" target="_blank">
        homepage
      </a>
    </span>
  ) : null

  return (
    <div className={styles.infoBar} data-cy="info-bar">
      <div className={styles.infoBarInner}>
        <div className={styles.infoBarTitle}>
          <div className={styles.titleText} data-cy="project-title">
            {name}
          </div>
          <div className={styles.subtitleText} data-cy="original-url">
            <a href={originalUrl} rel="noopener noreferrer" target="_blank">
              {ownerText}
            </a>
            {siteCom}
          </div>
        </div>
        <div className={styles.infoBarTitle}>
          <div className={styles.infoBarSummary} data-cy="project-description">
            {description}
          </div>
        </div>
      </div>
    </div>
  )
}

InfoBar.propTypes = {
  name: string.isRequired,
  originalUrl: string.isRequired,
  site: string,
  description: string.isRequired,
}

export default InfoBar
