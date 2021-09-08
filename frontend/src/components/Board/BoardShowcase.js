import React, { useState } from 'react'
import Image from 'next/image'

import useProjectAssets from '@hooks/useProjectAssets'
import { string } from 'prop-types'
import styles from './BoardShowcase.module.scss'

const dimensions = { height: 250, width: 450 }

const BoardShowcase = ({ assetsPath }) => {
  const { top, bottom, isLoading, isError } = useProjectAssets(assetsPath)
  const [selected, setSelected] = useState('top')

  return (
    <div data-cy="board-showcase" className={styles.showcaseContainer}>
      <div className={styles.boardShowcaseWithMenu}>
        <div className={styles.boardShowcaseContainer}>
          <div className={`${styles.toggleBoardView} ${styles.responsiveTabs}`}>
            <button
              type="button"
              onClick={() => setSelected('top')}
              disabled={selected === 'top'}
              className={`${styles.circuitToggleBtn}`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => setSelected('bottom')}
              disabled={selected === 'bottom'}
              className={`${styles.circuitToggleBtn}`}
            >
              Bottom
            </button>
          </div>
          <div className={styles.boardShowcase}>
            <div
              className={styles.boardContainer}
              // Using inline style to keep the container height same as images height.
              style={{ height: dimensions.height }}
            >
              <div
                className={`${styles.boardDiagram} ${
                  selected === 'top' ? styles.selectedBoard : ''
                }`}
              >
                {isLoading || isError ? null : (
                  <Image
                    {...dimensions}
                    data-cy="board-showcase-top"
                    src={top}
                    objectFit="contain"
                    alt="PCB top view"
                  />
                )}
              </div>
              <div className={styles.circuitBorderContainer}>
                <div className={styles.circuitBorder} />
              </div>
              <div
                className={`${styles.boardDiagram} ${
                  selected === 'bottom' ? styles.selectedBoard : ''
                }`}
              >
                {isLoading || isError ? null : (
                  <Image
                    {...dimensions}
                    data-cy="board-showcase-bottom"
                    src={bottom}
                    objectFit="contain"
                    alt="PCB bottom view"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

BoardShowcase.propTypes = {
  assetsPath: string.isRequired,
}

export default BoardShowcase
