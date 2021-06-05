import React, { useState } from 'react'

import useProjectAssets from '@hooks/useProjectAssets'
import styles from './BoardShowcase.module.scss'

const BoardShowcase = ({ projectFullname }) => {
  const { top, bottom, isLoading, isError } = useProjectAssets(projectFullname)
  const [selected, setSelected] = useState('top')

  return (
    <div className={styles.showcaseContainer}>
      <div className={styles.boardShowcaseWithMenu}>
        <div className={styles.boardShowcaseContainer}>
          <div className={`${styles.toggleBoardView} ${styles.responsiveTabs}`}>
            <button
              onClick={() => setSelected('top')}
              disabled={selected === 'top'}
              className={`${styles.circuitToggleBtn}`}
            >
              Top
            </button>
            <button
              onClick={() => setSelected('bottom')}
              disabled={selected === 'bottom'}
              className={`${styles.circuitToggleBtn}`}
            >
              Bottom
            </button>
          </div>
          <div className={styles.boardShowcase}>
            <div className={styles.boardContainer}>
              <div
                className={`${styles.boardDiagram} ${
                  selected === 'top' ? styles.selectedBoard : ''
                }`}
              >
                {isLoading || isError ? null : <img src={top} />}
              </div>
              <div className={styles.circuitBorderContainer}>
                <div className={styles.circuitBorder} />
              </div>
              <div
                className={`${styles.boardDiagram} ${
                  selected === 'bottom' ? styles.selectedBoard : ''
                }`}
              >
                {isLoading || isError ? null : <img src={bottom} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoardShowcase
