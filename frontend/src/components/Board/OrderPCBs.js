import React from 'react'
import { object, string } from 'prop-types'
import { Icon } from 'semantic-ui-react'

import styles from './OrderPCBs.module.scss'

const OrderPCBs = ({ zipUrl, boardSpecs }) => {
  const aislerUrl = `https://aisler.net/p/new?url=${zipUrl}&ref=kitspace`
  const pcbwayUrl = `https://www.pcbway.com/QuickOrderOnline.aspx?fileurl=${zipUrl}&from=kitspace`
  const oshparkUrl = `https://oshpark.com/import?url=${zipUrl}`
  const pcbShopperUrl = `https://pcbshopper.com/?Width=${boardSpecs.width}&Height=${boardSpecs.height}&Units=mm&Layers=${boardSpecs.layers}&Quantity=1&GetPrices`
  const jlcpcbUrl = `https://cart.jlcpcb.com/quote?fileurl=${zipUrl}&from=kitspace`

  // TODO
  // eslint-disable-next-line no-unused-vars
  const trackClick = vendor => e => {
    // window.plausible('Order PCBs', {
    //   props: { project: this.props.project, vendor },
    // })
  }

  return (
    <div className={styles.PCBMenu}>
      <div className={`${styles.PCBMenu__group} ${styles.PCBMenu__download}`}>
        <a href={zipUrl} className={styles.PCBMenu__link}>
          <Icon name="download" />
          Download Gerbers
        </a>
      </div>

      <div
        className={styles.PCBMenu__group}
        style={{ flexGrow: 1, justifyContent: 'space-around' }}
      >
        <div className={styles.PCBMenu__subTitle}>
          <h4>Order PCBs:</h4>
        </div>

        <div className={styles.PCBMenu__linksContainer}>
          <a
            rel="nofollow noreferrer"
            href={aislerUrl}
            target="_blank"
            className={styles.PCBMenu__link}
            onClick={trackClick('Aisler')}
            onAuxClick={trackClick('Aisler')}
          >
            <img src="/static/images/aisler.png" alt="Aisler logo" />
          </a>

          <a
            rel="nofollow noreferrer"
            href={pcbwayUrl}
            target="_blank"
            className={styles.PCBMenu__link}
            onClick={trackClick('PCBWay')}
            onAuxClick={trackClick('PCBWay')}
          >
            <img src="/static/images/pcbway.png" alt="PCBWay logo" />
          </a>

          <a
            rel="nofollow noreferrer"
            href={jlcpcbUrl}
            target="_blank"
            className={styles.PCBMenu__link}
            onClick={trackClick('JLCPCB')}
            onAuxClick={trackClick('JLCPCB')}
          >
            <img src="/static/images/jlcpcb.png" alt="JLCPCB logo" />
          </a>

          <a
            rel="nofollow noreferrer"
            href={oshparkUrl}
            target="_blank"
            className={styles.PCBMenu__link}
            onClick={trackClick('OSHPark')}
            onAuxClick={trackClick('OSHPark')}
          >
            <img src="/static/images/oshpark.png" alt="OSHPARK logo" />
          </a>
        </div>
      </div>

      <div className={`${styles.PCBMenu__group} ${styles.PCBMenu__compare}`}>
        <div className={styles.PCBMenu__subTitle}>
          <h4>Compare PCB Prices:</h4>
        </div>
        <div className={styles.PCBMenu__linksContainer}>
          <a
            rel="nofollow noreferrer"
            href={pcbShopperUrl}
            target="_blank"
            className={styles.PCBMenu__link}
            onClick={trackClick('PCBShopper')}
            onAuxClick={trackClick('PCBShopper')}
          >
            <img src="/static/images/pcbshopper.png" alt="PCBSHOPPER logo" />
          </a>
        </div>
      </div>
    </div>
  )
}

OrderPCBs.propTypes = {
  zipUrl: string.isRequired,
  boardSpecs: object.isRequired,
}

export default OrderPCBs
