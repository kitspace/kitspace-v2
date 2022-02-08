import React, { useEffect } from 'react'
import { string } from 'prop-types'

import styles from './index.module.scss'

const LiteYouTube = props => {
  // lite-youtube exports a web components so it has to be loaded on the client-side.
  useEffect(() => import('@justinribeiro/lite-youtube'), [])
  return (
    <div className={props.className}>
      <lite-youtube {...props}></lite-youtube>
    </div>
  )
}

LiteYouTube.propTypes = {
  className: string,
}

LiteYouTube.defaultProps = {
  className: styles.LiteYouTubeDefault,
}

export default LiteYouTube
