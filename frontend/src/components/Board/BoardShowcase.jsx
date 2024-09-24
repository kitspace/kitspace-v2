import React, { useState } from 'react'
import Image from 'next/image'

import useProjectAssets from '@hooks/useProjectAssets'
import { string } from 'prop-types'
import styles from './BoardShowcase.module.scss'

const dimensions = { height: 250, width: 450 }

const BoardShowcase = ({ assetPath }) => {
  const { top, bottom, isLoading, isError } = useProjectAssets(assetPath)
  const [selected, setSelected] = useState('top')

  return (
    <div className={styles.showcaseContainer} data-cy="board-showcase">
      <div className={styles.boardShowcaseWithMenu}>
        <div className={styles.boardShowcaseContainer}>
          <div className={`${styles.toggleBoardView} ${styles.responsiveTabs}`}>
            <button
              className={`${styles.circuitToggleBtn}`}
              disabled={selected === 'top'}
              type="button"
              onClick={() => setSelected('top')}
            >
              Top
            </button>
            <button
              className={`${styles.circuitToggleBtn}`}
              disabled={selected === 'bottom'}
              type="button"
              onClick={() => setSelected('bottom')}
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
                    // we are not using the next `Image` magic in order to simplify our CDN setup
                    // svgs are not optimized anyway so this is actually a no-op
                    unoptimized
                    alt="PCB top view"
                    data-cy="board-showcase-top"
                    objectFit="contain"
                    src={top}
                    {...dimensions}
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
                    // we are not using the next `Image` magic in order to simplify our CDN setup
                    // svgs are not optimized anyway so this is actually a no-op
                    unoptimized
                    alt="PCB bottom view"
                    data-cy="board-showcase-bottom"
                    objectFit="contain"
                    src={bottom}
                    {...dimensions}
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
  assetPath: string.isRequired,
}

export default BoardShowcase
