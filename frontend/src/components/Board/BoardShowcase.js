import React from 'react'

import useProjectAssets from '@hooks/useProjectAssets'
import styles from './BoardShowcase.module.scss'
import { Button } from 'semantic-ui-react'

const BoardShowcase = ({ projectFullname }) => {
  const { top, bottom, isLoading, isError } = useProjectAssets(projectFullname)

  return (
    <div className={styles.showcaseContainer}>
      <div className={styles.boardShowcase}>
        <div className={styles.boardContainer}>
          <div className={styles.boardDiagram}>
            {isLoading || isError ? null : <img src={top} />}
          </div>
          <div className={styles.circuitBorderContainer}>
            <div className={styles.circuitBorder}></div>
          </div>
          <div className={styles.boardDiagram}>
            {isLoading || isError ? null : <img src={bottom} />}
          </div>
        </div>
      </div>
      <div className={styles.buttonsBar}>
        <Button>Upload</Button>
      </div>
    </div>
  )
}

export default BoardShowcase
