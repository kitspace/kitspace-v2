import React, { useEffect, useState } from 'react'
import OneClickBom from '1-click-bom-minimal'
import { Header, Icon, Segment, Input, Button } from 'semantic-ui-react'

import Bom from './Bom'
import DirectStores from './DirectStores'
import styles from './index.module.scss'

const BuyParts = ({ projectFullName, lines, parts }: BuyPartsProps) => {
  const [buyMultiplier, setBuyMultiplier] = useState(1)
  const [mult, setMult] = useState(1)
  const [buyAddPercent, setBuyAddPercent] = useState(0)

  const downloadBom = (retailer: string) => {
    window.plausible('Buy Parts', {
      props: {
        project: projectFullName,
        vendor: retailer,
        multiplier: mult,
      },
    })

    const data = rsBom(lines, mult, buyAddPercent)
    const csvContent = `${data.map(e => e.join(',')).join('\n')}\n`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.getElementById(`retailer-${retailer}`).closest('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${retailer}-kitspace-bom.csv`)
    link.click()
  }

  const retailerList: Array<string> = OneClickBom.getRetailers()
  const retailerButtons = retailerList
    .map((name: string): React.ReactElement | null => {
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
            downloadBom={() => downloadBom(name)}
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
          <AdjustQuantity
            buyAddPercent={buyAddPercent}
            buyMultiplier={buyMultiplier}
            setBuyAddPercent={v => setBuyAddPercent(v)}
            setBuyMultiplier={v => setBuyMultiplier(v)}
          />
          <Segment attached className={styles.buttonSegment}>
            {retailerButtons}
          </Segment>
          <DirectStores items={lines} multiplier={mult} />
        </>
      ) : (
        <NoPurchasableParts />
      )}
      <Bom length={lines.length} parts={parts} tsv={linesToTsv()} />
    </div>
  )
}

const NoPurchasableParts = () => (
  <Segment
    attached
    disabled
    className={styles.buttonSegment}
    data-cy="buy-parts-no-purchasable-parts"
  >
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
}: AdjustQuantityProps) => (
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
  downloadBom,
  numberOfLines,
  totalLines,
  numberOfParts,
}: RetailerButtonProps) => {
  const color = 'green'
  return (
    <Button
      as={'a'}
      className={`${styles.retailerButton} ${styles[color]}`}
      color={color}
      content={
        <div className={styles.buttonText}>
          <StoreIcon retailer={name} />
          {name}
        </div>
      }
      label={{
        className: `${styles.retailerLabel} ${styles[color]} `,
        content: (
          <div
            id={`retailer-${name}`}
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
      onClick={downloadBom}
    />
  )
}

const StoreIcon = ({ retailer }: StoreIconProps) => {
  const imgHref = `/distributor_icons/${retailer.toLowerCase()}.png`
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

type rsRow = [string, string, string, string, string, string]

const rsBom = (lines: Array<any>, multiplier: number, addPercent: number) => {
  const bom: Array<rsRow> = [
    [
      'Product Number',
      'Brand',
      'MPN',
      'Description',
      'Quantity',
      'Customer Part Number',
    ],
  ]

  for (const line of lines) {
    if (line.retailers?.RS) {
      const row: rsRow = [
        line.retailers.RS,
        line.partNumbers?.[0]?.manufacturer,
        line.partNumbers?.[0]?.part,
        line.description,
        calculateQuantity(line.quantity, multiplier, addPercent).toString(),
        line.row,
      ]
      bom.push(row)
    }
  }

  return bom
}

export const calculateQuantity = (
  quantity: number,
  multiplier: number,
  addPercent: number,
) => {
  let newQuantity = Math.ceil(quantity * multiplier)
  if (addPercent > 0) {
    newQuantity += Math.ceil(newQuantity * (addPercent / 100))
  }
  return newQuantity
}

interface BuyPartsProps {
  projectFullName: string
  lines: Array<any>
  parts: Array<any>
}

interface AdjustQuantityProps {
  buyMultiplier: number
  setBuyMultiplier: (v: number) => void
  buyAddPercent: number
  setBuyAddPercent: (v: number) => void
}

interface RetailerButtonProps {
  name: string
  downloadBom: () => void
  numberOfLines: number
  totalLines: number
  numberOfParts: number
}

interface StoreIconProps {
  retailer: string
}

export default BuyParts
