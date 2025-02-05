import getConfig from 'next/config'
import Image from 'next/image'
import { object, string } from 'prop-types'
import { Icon } from 'semantic-ui-react'

import styles from './OrderPCBs.module.scss'

const serviceLogoDimensions = { height: 29, width: 100 }

const frontendAssetUrl =
  getConfig().publicRuntimeConfig.KITSPACE_FRONTEND_ASSET_URL || ''

const OrderPCBs = ({ zipUrl, boardSpecs, projectFullname }) => {
  const aislerUrl = `https://aisler.net/p/new?url=${zipUrl}&ref=kitspace`
  const pcbwayUrl = `https://www.pcbway.com/QuickOrderOnline.aspx?fileurl=${zipUrl}&from=kitspace`
  const oshparkUrl = `https://oshpark.com/import?url=${zipUrl}`
  const pcbShopperUrl = `https://pcbshopper.com/?Width=${boardSpecs.width}&Height=${boardSpecs.height}&Units=mm&Layers=${boardSpecs.layers}&Quantity=1&GetPrices`

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
              unoptimized
              alt="Aisler logo"
              src={`${frontendAssetUrl}/static/images/aisler.png`}
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
              unoptimized
              alt="PCBWay logo"
              src={`${frontendAssetUrl}/static/images/pcbway.png`}
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
              unoptimized
              alt="OSHPark logo"
              src={`${frontendAssetUrl}/static/images/oshpark.png`}
              {...serviceLogoDimensions}
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
              unoptimized
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
