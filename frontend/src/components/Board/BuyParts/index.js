import React, { useEffect, useState } from 'react'
import OneClickBom from '1-click-bom-minimal'
import { Header, Icon, Segment, Input, Button } from 'semantic-ui-react'

import Bom from './Bom'
import InstallPrompt, { install1ClickBOM } from './InstallPrompt'
import DirectStores from './DirectStores'
import styles from './index.module.scss'

const BuyParts = ({ project, lines, parts }) => {
  const [extensionPresence, setExtensionPresence] = useState('unknown')
  const [buyParts, setBuyParts] = useState(null)
  const [buyMultiplier, setBuyMultiplier] = useState(1)
  const [mult, setMult] = useState(1)
  const [buyAddPercent, setBuyAddPercent] = useState(0)
  const [adding, setAdding] = useState({})

  const retailerList = OneClickBom.getRetailers()
  const retailerButtons = retailerList
    .map(name => {
      const [numberOfLines, numberOfParts] = lines.reduce(
        ([numberOfLines, numberOfParts], line) => {
          if (line.retailers[name]) {
            return [
              numberOfLines + 1,
              numberOfParts + Math.ceil(mult * line.quantity),
            ]
          }
          return [numberOfLines, numberOfParts]
        },
        [0, 0],
      )
      if (numberOfLines > 0) {
        return (
          <RetailerButton
            name={name}
            adding={adding[name]}
            extensionPresence={name === 'Digikey' ? false : extensionPresence}
            buyParts={() => install1ClickBOM()}
            numberOfParts={numberOfParts}
            numberOfLines={numberOfLines}
            totalLines={lines.length}
            key={name}
          />
        )
      }
    })
    .filter(l => l != null)

  useEffect(() => {
    // extension communication
    window.addEventListener(
      'message',
      event => {
        if (event.source != window) {
          return
        }
        if (event.data.from == 'extension') {
          setExtensionPresence('present')
          switch (event.data.message) {
            case 'register':
              setBuyParts(retailer => {
                window.plausible('Buy Parts', {
                  props: {
                    project,
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
          }
        }
      },
      false,
    )
  }, [])

  useEffect(() => {
    const multi = buyMultiplier
    if (isNaN(multi) || multi < 1) {
      setMult(1)
    }
    const percent = buyAddPercent
    if (isNaN(percent) || percent < 1) {
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

  return (
    <div className={styles.BuyParts}>
      <Header textAlign="center" as="h3" attached="top">
        <Icon
          style={{ fontSize: '14pt', marginBottom: 5 }}
          name="shopping basket"
        />
        Buy Parts
      </Header>
      <InstallPrompt extensionPresence={extensionPresence} />
      <AdjustQuantity
        buyMultiplier={buyMultiplier}
        buyAddPercent={buyAddPercent}
        setBuyMultiplier={v => setBuyMultiplier(v)}
        setBuyAddPercent={v => setBuyAddPercent(v)}
      />
      <Segment className={styles.buttonSegment} attached>
        {retailerButtons}
      </Segment>
      <Bom attached parts={parts} tsv={linesToTsv()} length={lines.length} />
      <DirectStores multiplier={mult} items={lines} />
    </div>
  )
}

const AdjustQuantity = props => (
  <Segment textAlign="center" attached className={styles.AdjustQuantity}>
    Adjust quantity:
    <Icon
      style={{
        margin: 5,
        marginTop: 0,
      }}
      name="delete"
    />
    <Input
      type="number"
      size="mini"
      min={1}
      value={props.buyMultiplier}
      style={{ width: 80 }}
      error={isNaN(props.buyMultiplier) || props.buyMultiplier < 1}
      onBlur={e => {
        const v = props.buyMultiplier
        if (isNaN(v) || v < 1) {
          props.setBuyMultiplier(1)
        }
      }}
      onChange={e => {
        const v = parseFloat(e.target.value)
        props.setBuyMultiplier(v)
      }}
    />
    <Icon
      style={{
        margin: 10,
        marginTop: 0,
      }}
      name="plus"
    />
    <Input
      type="number"
      min={0}
      step={10}
      value={props.buyAddPercent}
      size="mini"
      style={{ width: 80 }}
      error={isNaN(props.buyAddPercent) || props.buyAddPercent < 0}
      onBlur={e => {
        const v = props.buyAddPercent
        if (isNaN(v) || v < 0) {
          props.setBuyAddPercent(0)
        }
      }}
      onChange={e => {
        const v = parseFloat(e.target.value)
        props.setBuyAddPercent(v)
      }}
    />
    <span className={styles.notSelectable} style={{ marginLeft: 5 }}>
      %
    </span>
  </Segment>
)

const RetailerButton = props => {
  const r = props.name
  let onClick = props.buyParts
  // if the extension is not here fallback to direct submissions
  if (props.extensionPresence !== 'present' && typeof document !== 'undefined') {
    onClick = () => {
      const form = document.getElementById(`${r}Form`)
      if (form) {
        form.submit()
      } else {
        props.buyParts()
      }
    }
  }
  const color = props.numberOfLines === props.totalLines ? 'green' : 'pink'
  return (
    <Button
      onClick={onClick}
      loading={props.adding}
      color={color}
      content={
        <div className={styles.buttonText}>
          <StoreIcon retailer={r} />
          {r}
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
              {props.numberOfLines}/{props.totalLines} lines ({props.numberOfParts}{' '}
              parts)
            </div>
            <div>
              <Icon name="plus" />
              <Icon name="shopping basket" />
            </div>
          </div>
        ),
      }}
      labelPosition="right"
      className={`${styles.retailerButton} ${styles[color]}`}
    />
  )
}

const StoreIcon = props => {
  const imgHref = `/static/images/${props.retailer}${
    props.disabled ? '-grey' : ''
  }.ico`
  return (
    <img
      className={styles.storeIcons}
      key={props.retailer}
      src={imgHref}
      alt={props.retailer}
    />
  )
}

export default BuyParts
