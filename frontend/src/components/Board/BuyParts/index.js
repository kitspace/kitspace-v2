import React, { useEffect, useState } from 'react'
import { array, bool, func, number, string } from 'prop-types'
import OneClickBom from '1-click-bom-minimal'
import { Header, Icon, Segment, Input, Button } from 'semantic-ui-react'

import Bom from './Bom'
import InstallPrompt, { install1ClickBOM } from './InstallPrompt'
import DirectStores from './DirectStores'
import styles from './index.module.scss'

const BuyParts = ({ projectFullName, lines, parts }) => {
  const [extensionPresence, setExtensionPresence] = useState('unknown')
  // it's needed to fix the extension integration.
  // eslint-disable-next-line no-unused-vars
  const [buyParts, setBuyParts] = useState(null)
  const [buyMultiplier, setBuyMultiplier] = useState(1)
  const [mult, setMult] = useState(1)
  const [buyAddPercent, setBuyAddPercent] = useState(0)
  const [adding, setAdding] = useState({})

  const retailerList = OneClickBom.getRetailers()
  const retailerButtons = retailerList
    .map(name => {
      const [numberOfLines, numberOfParts] = lines.reduce(
        ([numOfLines, numOfParts], line) => {
          if (line.retailers[name]) {
            return [numOfLines + 1, numOfParts + Math.ceil(mult * line.quantity)]
          }
          return [numOfLines, numOfParts]
        },
        [0, 0],
      )
      if (numberOfLines > 0) {
        return (
          <RetailerButton
            key={name}
            adding={adding[name]}
            buyParts={() => install1ClickBOM()}
            extensionPresence={name === 'Digikey' ? 'absent' : extensionPresence}
            name={name}
            numberOfLines={numberOfLines}
            numberOfParts={numberOfParts}
            totalLines={lines.length}
          />
        )
      }
      return null
    })
    .filter(l => l != null)

  useEffect(() => {
    // extension communication
    window.addEventListener(
      'message',
      event => {
        if (event.source !== window) {
          return
        }
        if (event.data.from === 'extension') {
          setExtensionPresence('present')
          switch (event.data.message) {
            case 'register':
              setBuyParts(retailer => {
                window.plausible('Buy Parts', {
                  props: {
                    project: projectFullName,
                    vendor: retailer,
                    multiplier: mult,
                  },
                })
                window.postMessage(
                  {
                    from: 'page',
                    message: 'quickAddToCart',
                    value: {
                      retailer,
                      multiplier: mult,
                    },
                  },
                  '*',
                )
              })
              break
            case 'updateAddingState':
              setAdding(event.data.value)
              break
            default:
              break
          }
        }
      },
      false,
    )
  }, [mult, projectFullName])

  useEffect(() => {
    const multi = buyMultiplier
    if (Number.isNaN(multi) || multi < 1) {
      setMult(1)
    }
    const percent = buyAddPercent
    if (Number.isNaN(percent) || percent < 1) {
      setMult(0)
    }
    setMult(multi + multi * (percent / 100))
  }, [buyMultiplier, buyAddPercent])

  const linesToTsv = () => {
    const linesMult = lines.map(line => ({
      ...line,
      quantity: Math.ceil(line.quantity * mult),
    }))
    return OneClickBom.writeTSV(linesMult)
  }
  const hasPurchasableParts = retailerButtons.length !== 0
  return (
    <div className={styles.BuyParts} data-cy="buy-parts">
      <Header as="h3" attached="top" textAlign="center">
        <Icon className={styles.BuyPartsIcon} name="shopping basket" />
        Buy Parts
      </Header>
      {hasPurchasableParts ? (
        <>
          <InstallPrompt extensionPresence={extensionPresence} />
          <AdjustQuantity
            buyAddPercent={buyAddPercent}
            buyMultiplier={buyMultiplier}
            setBuyAddPercent={v => setBuyAddPercent(v)}
            setBuyMultiplier={v => setBuyMultiplier(v)}
          />
          <Segment attached className={styles.buttonSegment}>
            {retailerButtons}
          </Segment>
          <Bom attached length={lines.length} parts={parts} tsv={linesToTsv()} />
          <DirectStores items={lines} multiplier={mult} />
        </>
      ) : (
        <NoPurchasableParts />
      )}
    </div>
  )
}

const NoPurchasableParts = () => (
  <Segment attached disabled className={styles.buttonSegment}>
    <p className={styles.NoPurchasablePartsText}>
      No parts to buy have been specified in this project&apos;s BOM yet.
    </p>
  </Segment>
)

const AdjustQuantity = ({
  buyMultiplier,
  setBuyMultiplier,
  buyAddPercent,
  setBuyAddPercent,
}) => (
  <Segment attached className={styles.AdjustQuantity} textAlign="center">
    Adjust quantity:
    <Icon className={styles.AdjustQuantityIcon} name="delete" />
    <Input
      error={Number.isNaN(buyMultiplier) || buyMultiplier < 1}
      min={1}
      size="mini"
      style={{ width: 80 }}
      type="number"
      value={buyMultiplier}
      onBlur={() => {
        const v = buyMultiplier
        if (Number.isNaN(v) || v < 1) {
          setBuyMultiplier(1)
        }
      }}
      onChange={e => {
        const v = parseFloat(e.target.value)
        setBuyMultiplier(v)
      }}
    />
    <Icon className={styles.AdjustQuantityIcon} name="plus" />
    <Input
      error={Number.isNaN(buyAddPercent) || buyAddPercent < 0}
      min={0}
      size="mini"
      step={10}
      style={{ width: 80 }}
      type="number"
      value={buyAddPercent}
      onBlur={() => {
        const v = buyAddPercent
        if (Number.isNaN(v) || v < 0) {
          setBuyAddPercent(0)
        }
      }}
      onChange={e => {
        const v = parseFloat(e.target.value)
        setBuyAddPercent(v)
      }}
    />
    <span className={styles.notSelectable} style={{ marginLeft: 5 }}>
      %
    </span>
  </Segment>
)

const RetailerButton = ({
  name,
  buyParts,
  extensionPresence,
  numberOfLines,
  totalLines,
  numberOfParts,
  adding,
}) => {
  let onClick = buyParts
  // if the extension is not here fallback to direct submissions
  if (extensionPresence !== 'present' && typeof document !== 'undefined') {
    onClick = () => {
      const form = document.getElementById(`${name}Form`)
      if (form) {
        form.submit()
      } else {
        buyParts()
      }
    }
  }
  const color = numberOfLines === totalLines ? 'green' : 'pink'
  return (
    <Button
      className={`${styles.retailerButton} ${styles[color]}`}
      color={color}
      content={
        <div className={styles.buttonText}>
          <StoreIcon retailer={name} />
          {name}
        </div>
      }
      label={{
        as: 'a',
        className: `${styles.retailerLabel} ${styles[color]} `,
        content: (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              {numberOfLines}/{totalLines} lines ({numberOfParts} parts)
            </div>
            <div>
              <Icon name="plus" />
              <Icon name="shopping basket" />
            </div>
          </div>
        ),
      }}
      labelPosition="right"
      loading={adding}
      onClick={onClick}
    />
  )
}

const StoreIcon = ({ retailer, disabled }) => {
  const imgHref = `/static/images/${retailer}${disabled ? '-grey' : ''}.ico`
  return (
    /*
     * Styling this as a Next Image is unnecessarily complicated.
     * Also, the next optimizations for this image aren't that useful.
     * see https://github.com/vercel/next.js/discussions/22861.
     */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={retailer}
      alt={retailer}
      className={styles.storeIcons}
      src={imgHref}
    />
  )
}

BuyParts.propTypes = {
  projectFullName: string.isRequired,
  lines: array.isRequired,
  parts: array.isRequired,
}

AdjustQuantity.propTypes = {
  buyMultiplier: number.isRequired,
  setBuyMultiplier: func.isRequired,
  buyAddPercent: number.isRequired,
  setBuyAddPercent: func.isRequired,
}

RetailerButton.propTypes = {
  name: string.isRequired,
  buyParts: func.isRequired,
  extensionPresence: string.isRequired,
  numberOfLines: number.isRequired,
  totalLines: number.isRequired,
  numberOfParts: number.isRequired,
  adding: bool,
}
RetailerButton.defaultProps = {
  adding: false,
}

StoreIcon.propTypes = {
  retailer: string.isRequired,
  disabled: bool,
}

StoreIcon.defaultProps = {
  disabled: false,
}

export default BuyParts
