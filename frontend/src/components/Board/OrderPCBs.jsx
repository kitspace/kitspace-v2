import React from 'react'
import Image from 'next/image'
import { object, string } from 'prop-types'
import { Icon } from 'semantic-ui-react'

import styles from './OrderPCBs.module.scss'

const serviceLogoDimensions = { height: 29, width: 100 }

const OrderPCBs = ({ zipUrl, boardSpecs, projectFullname }) => {
  const aislerUrl = `https://aisler.net/p/new?url=${zipUrl}&ref=kitspace`
  const pcbwayUrl = `https://www.pcbway.com/QuickOrderOnline.aspx?fileurl=${zipUrl}&from=kitspace`
  const oshparkUrl = `https://oshpark.com/import?url=${zipUrl}`
  const pcbShopperUrl = `https://pcbshopper.com/?Width=${boardSpecs.width}&Height=${boardSpecs.height}&Units=mm&Layers=${boardSpecs.layers}&Quantity=1&GetPrices`
  const jlcpcbUrl = `https://cart.jlcpcb.com/quote?fileurl=${zipUrl}&from=kitspace`
  const pcbgogoUrl = `https://www.pcbgogo.com/pcb-fabrication-quote.html?fileurl=${zipUrl}`

  const trackClick = vendor => () => {
    window.plausible('Order PCBs', {
      props: { project: projectFullname, vendor },
    })
  }

  return (
    <div className={styles.PCBMenu} data-cy="order-pcb">
      <div className={`${styles.PCBMenu__group} ${styles.PCBMenu__download}`}>
        <a className={styles.PCBMenu__link} href={zipUrl}>
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
            className={styles.PCBMenu__link}
            href={aislerUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('Aisler')}
            onClick={trackClick('Aisler')}
          >
            <Image
              alt="Aisler logo"
              src="/static/images/aisler.png"
              {...serviceLogoDimensions}
            />
          </a>

          <a
            className={styles.PCBMenu__link}
            href={pcbwayUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('PCBWay')}
            onClick={trackClick('PCBWay')}
          >
            <Image
              alt="PCBWay logo"
              src="/static/images/pcbway.png"
              {...serviceLogoDimensions}
            />
          </a>

          <a
            className={styles.PCBMenu__link}
            href={jlcpcbUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('JLCPCB')}
            onClick={trackClick('JLCPCB')}
          >
            <Image
              alt="JLCPCB logo"
              src="/static/images/jlcpcb.png"
              {...serviceLogoDimensions}
            />
          </a>

          <a
            className={styles.PCBMenu__link}
            href={oshparkUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('OSHPark')}
            onClick={trackClick('OSHPark')}
          >
            <Image
              alt="OSHPark logo"
              src="/static/images/oshpark.png"
              {...serviceLogoDimensions}
            />
          </a>
          <a
            className={styles.PCBMenu__link}
            href={pcbgogoUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('PCBGoGo')}
            onClick={trackClick('PCBGoGo')}
          >
            <Image
              alt="PCBGoGo logo"
              src="/static/images/pcbgogo.png"
              {...serviceLogoDimensions}
            />
          </a>
          <a
            className={styles.PCBMenu__link}
            href={pcbgogoUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('PCBGoGo')}
            onClick={trackClick('PCBGoGo')}
          >
            <Image
              alt="PCBGoGo logo"
              src="/static/images/pcbgogo.png"
              {...retailerLogosDimensions}
            />
          </a>
        </div>
      </div>

      <div className={`${styles.PCBMenu__group} ${styles.PCBMenu__compare}`}>
        <div className={styles.PCBMenu__subTitle}>
          <h4>Compare PCB Prices:</h4>
        </div>
        <div className={styles.PCBMenu__linksContainer}>
          <a
            className={styles.PCBMenu__link}
            href={pcbShopperUrl}
            rel="nofollow noreferrer"
            target="_blank"
            onAuxClick={trackClick('PCBShopper')}
            onClick={trackClick('PCBShopper')}
          >
            <Image
              alt="PCBSHOPPER logo"
              src="/static/images/pcbshopper.png"
              {...serviceLogoDimensions}
            />
          </a>
        </div>
      </div>
    </div>
  )
}

OrderPCBs.propTypes = {
  projectFullname: string.isRequired,
  zipUrl: string.isRequired,
  boardSpecs: object.isRequired,
}

export default OrderPCBs
