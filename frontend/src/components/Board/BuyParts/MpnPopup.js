import React, { useState } from 'react'
import { func, node, object } from 'prop-types'
import { Popup, Image, Table, Icon, Button } from 'semantic-ui-react'
import { flattenDeep } from 'lodash'

import styles from './MpnPopup.module.scss'

const MpnPopup = ({ onOpen, onClose, trigger, part }) => {
  const [expanded, setExpanded] = useState(false)

  const popUpProps = {
    hoverable: true,
    mouseLeaveDelay: 200,
    mouseEnterDelay: 200,
    position: 'bottom left',
    trigger,
    onOpen,
    onClose,
    flowing: true,
  }

  const reorder = specs => {
    const importance = [
      ['color', 'capacitance', 'resistance'],
      ['case_package'],
      ['dielectric_characteristic'],
      ['resistance_tolerance', 'capacitance_tolerance'],
      ['voltage_rating', 'power_rating'],
      ['pin_count'],
      ['case_package_si'],
    ]

    const groups = specs.reduce((acc, spec) => {
      let index = importance.reduce((prev, keys, i) => {
        if (keys.indexOf(spec.key) >= 0) {
          return i
        }
        return prev
      }, null)
      if (index == null) {
        index = acc.length - 1
      }
      acc[index].push(spec)
      return acc
    }, importance.map(() => []).concat([[]]))

    return flattenDeep(groups)
  }

  if (Object.keys(part).length === 0) {
    return (
      <Popup {...popUpProps} content="Sorry, no further part information found." />
    )
  }

  const { image, mpn, specs } = part
  const { number } = mpn?.part
  let orderedSpecs = reorder(specs || [])

  if (!expanded) {
    orderedSpecs = orderedSpecs.slice(0, 4)
  }
  const tableData = orderedSpecs.map(spec => [spec.name, spec.value])
  const renderBodyRow = args => (
    <Table.Row key={String(args)}>
      {args.map(text => (
        <Table.Cell>{text}</Table.Cell>
      ))}
    </Table.Row>
  )

  return (
    <Popup {...popUpProps}>
      <div className={styles.topAreaContainer}>
        <div className={styles.componentFigure}>
          <div>
            <div className={styles.imageContainer}>
              <Image src={image?.url} />
            </div>
            <a style={{ fontSize: 9 }} href={image?.credit_url}>
              {image?.credit_string}
            </a>
          </div>
          <div className={styles.octopartLinkContainer}>
            <a
              href={
                number
                  ? `https://octopart.com/search?q=${number}`
                  : 'https://octopart.com/'
              }
            >
              Powered by Octopart
            </a>
          </div>
        </div>
        <div style={{ marginLeft: 20 }}>
          <div style={{ maxWidth: 200 }}>{part.description}</div>
          <div className={styles.datasheetContainer}>
            <a href={part.datasheet}>
              <Icon name="file pdf outline" />
              Datasheet
            </a>
          </div>
          <Table
            basic="very"
            compact
            tableData={tableData}
            renderBodyRow={renderBodyRow}
          />
          {part.specs?.length > 4 ? (
            <div className={styles.expansionButton}>
              <Button
                onClick={() => setExpanded(!expanded)}
                size="tiny"
                basic
                content={expanded ? '⇡' : '...'}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Popup>
  )
}

MpnPopup.propTypes = {
  onOpen: func.isRequired,
  onClose: func.isRequired,
  trigger: node.isRequired,
  part: object.isRequired,
}

export default MpnPopup
