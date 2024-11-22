import React, { useEffect, useState } from 'react'
import OneClickBom from '1-click-bom-minimal'
import { Header, Icon, Segment, Input, Button } from 'semantic-ui-react'

import Bom from './Bom'
import DirectStores from './DirectStores'
import styles from './index.module.scss'

const BuyParts = ({ projectFullName, lines, parts }: BuyPartsProps) => {
  const [buyMultiplier, setBuyMultiplier] = useState(1)
  const [multiplier, setMultiplier] = useState(1)
  const [buyAddPercent, setBuyAddPercent] = useState(0)

  const retailerList: Array<string> = OneClickBom.getRetailers()
  const retailerButtons = retailerList
    .map((retailerName: string): React.ReactElement | null => {
      const [numberOfLines, numberOfParts] = lines.reduce(
        ([numOfLines, numOfParts], line) => {
          if (line.retailers[retailerName]) {
            return [
              numOfLines + 1,
              numOfParts + Math.ceil(multiplier * line.quantity),
            ]
          }
          return [numOfLines, numOfParts]
        },
        [0, 0],
      )

      if (numberOfLines > 0) {
        return (
          <RetailerButton
            key={retailerName}
            icons={retailerName === 'Digikey' ? 'link' : 'download'}
            name={retailerName}
            numberOfLines={numberOfLines}
            numberOfParts={numberOfParts}
            totalLines={lines.length}
            onClick={() => {
              window.plausible('Buy Parts', {
                props: {
                  project: projectFullName,
                  vendor: retailerName,
                  multiplier: multiplier,
                },
              })

              if (retailerName === 'Digikey') {
                redirectToStore(retailerName)
                return
              }

              downloadBomCSV({
                name: projectFullName.replace('/', '-'),
                lines,
                multiplier,
                buyAddPercent,
                retailer: retailerName as Retailer,
              })
            }}
          />
        )
      }
      return null
    })
    .filter(l => l != null)

  useEffect(() => {
    const multi = buyMultiplier
    if (Number.isNaN(multi) || multi < 1) {
      setMultiplier(1)
    }
    const percent = buyAddPercent
    if (Number.isNaN(percent) || percent < 1) {
      setMultiplier(0)
    }
    setMultiplier(multi + multi * (percent / 100))
  }, [buyMultiplier, buyAddPercent])

  const linesToTsv = () => {
    const linesMult = lines.map(line => ({
      ...line,
      quantity: Math.ceil(line.quantity * multiplier),
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
          <DirectStores items={lines} multiplier={multiplier} />
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
    <span className={`${styles.notSelectable} ${styles.addPercent}`}>%</span>
  </Segment>
)

const RetailerButton = ({
  name,
  onClick,
  numberOfLines,
  totalLines,
  numberOfParts,
  icons,
}: RetailerButtonProps) => {
  const color = numberOfLines === totalLines ? 'green' : 'pink'
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
          <>
            <div
              className={`${styles.retailerLabelContent}`}
              id={`retailer-${name}`}
            >
              <div>
                {numberOfLines}/{totalLines} lines ({numberOfParts} parts)
              </div>
            </div>
            <div className={`${styles.retailerLabelIcons}`}>
              {icons === 'link' ? (
                <>
                  <Icon name="plus" />
                  <Icon name="shopping basket" />
                  <Icon name="external square" />
                </>
              ) : (
                <>
                  <Icon name="file alternate outline" />
                  <Icon name="download" />
                </>
              )}
            </div>
          </>
        ),
      }}
      labelPosition="right"
      onClick={onClick}
    ></Button>
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

const rsBom = (lines: Array<Line>, multiplier: number, addPercent: number) => {
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
        line.reference,
      ]
      bom.push(row)
    }
  }

  return bom
}

const farnellBom = (lines: Array<Line>, multiplier: number, addPercent: number) => {
  const bom: Array<farnellRow> = [['Part Number', 'Quantity', 'Line Note']]
  for (const line of lines) {
    if (line.retailers.Farnell || line.retailers.Newark) {
      const row: farnellRow = [
        line.retailers.Farnell || line.retailers.Newark,
        calculateQuantity(line.quantity, multiplier, addPercent).toString(),
        line.reference,
      ]
      bom.push(row)
    }
  }
  return bom
}

const mouserBom = (lines: Array<Line>, multiplier: number, addPercent: number) => {
  const bom: Array<mouserRow> = [
    [
      'Mouser Part Number',
      'Mfr Part Number',
      'Mfr Name',
      'Description',
      'Quantity',
      'Customer Part Number',
    ],
  ]

  for (const line of lines) {
    if (line.retailers?.Mouser) {
      const row: mouserRow = [
        line.retailers.Mouser,
        line.partNumbers?.[0]?.manufacturer,
        line.partNumbers?.[0]?.part,
        line.description,
        calculateQuantity(line.quantity, multiplier, addPercent).toString(),
        line.reference,
      ]
      bom.push(row)
    }
  }

  return bom
}

const lcscBom = (lines: Array<Line>, multiplier: number, addPercent: number) => {
  const bom: Array<lcscRow> = [
    [
      'Quantity',
      'LCSC Part Number',
      'Manufacturer',
      'Manufacturer Part Number',
      'Description',
      'Customer Part Number',
    ],
  ]

  for (const line of lines) {
    const row: lcscRow = [
      calculateQuantity(line.quantity, multiplier, addPercent).toString(),
      line.retailers?.LCSC,
      line.partNumbers?.[0]?.manufacturer,
      line.partNumbers?.[0]?.part,
      line.description,
      line.reference,
    ]
    bom.push(row)
  }

  return bom
}
type Retailer = 'RS' | 'Newark' | 'Farnell' | 'Mouser' | 'LCSC' | 'Digikey'

const csvBom = (
  lines: Array<Line>,
  multiplier: number,
  addPercent: number,
  retailer: Retailer,
) => {
  switch (retailer) {
    case 'RS':
      return rsBom(lines, multiplier, addPercent)
    // Newark and Farnell have the same file format.
    case 'Newark':
    case 'Farnell':
      return farnellBom(lines, multiplier, addPercent)
    case 'Mouser':
      return mouserBom(lines, multiplier, addPercent)
    case 'LCSC':
      return lcscBom(lines, multiplier, addPercent)
    default:
      throw new Error(`Unknown retailer: ${retailer}`)
  }
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

function downloadBomCSV({
  name,
  lines,
  multiplier,
  buyAddPercent,
  retailer,
}: Order) {
  const csvContent = `${csvBom(lines, multiplier, buyAddPercent, retailer)
    .map((e: Array<string>) => e.join(','))
    .join('\n')}\n`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.getElementById(`retailer-${retailer}`).closest('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${name}-${retailer}-kitspace-bom.csv`)
}

function redirectToStore(retailer: Retailer) {
  const form = document.getElementById(`${retailer}Form`) as HTMLFormElement
  form.submit()
}

interface Order {
  name: string
  lines: Array<Line>
  multiplier: number
  buyAddPercent: number
  retailer: Retailer
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
  onClick: () => void
  numberOfLines: number
  totalLines: number
  numberOfParts: number
  icons: 'link' | 'download'
}

interface StoreIconProps {
  retailer: string
}

type farnellRow = [string, string, string]
type rsRow = [string, string, string, string, string, string]
type lcscRow = [string, string, string, string, string, string]
type mouserRow = [string, string, string, string, string, string]

type Line = {
  retailers: {
    RS: string
    Farnell: string
    Newark: string
    LCSC: string
    Mouser: string
  }
  reference: string
  partNumbers: Array<{ manufacturer: string; part: string }>
  description: string
  quantity: number
  row: string
}

export default BuyParts
