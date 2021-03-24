import react, { useEffect, useState } from 'react'
import { Popup, Image, Table, Icon, Button } from 'semantic-ui-react'
import { h, a, div } from 'react-hyperscript-helpers'
import { flattenDeep } from 'lodash'

import styles from './MpnPopup.module.scss'

const importance = [
  ['color', 'capacitance', 'resistance'],
  ['case_package'],
  ['dielectric_characteristic'],
  ['resistance_tolerance', 'capacitance_tolerance'],
  ['voltage_rating', 'power_rating'],
  ['pin_count'],
  ['case_package_si'],
]

const reorder = specs => {
  const groups = specs.reduce((acc, spec) => {
    let index = importance.reduce((prev, keys, index) => {
      if (keys.indexOf(spec.key) >= 0) {
        return index
      }
      return prev
    }, null)
    if (index == null) {
      index = acc.length - 1
    }
    acc[index].push(spec)
    return acc
  }, importance.map(x => []).concat([[]]))
  return flattenDeep(groups)
}

const MpnPopup = ({ onOpen, onClose, trigger, part, open, offset }) => {
  const [expanded, setExpanded] = useState(false)

  const custom = {
    className: styles.MpnPopup,
    hoverable: true,
    mouseLeaveDelay: 200,
    mouseEnterDelay: 200,
    position: 'bottom left',
    trigger,
    onOpen,
    onClose,
    offset,
    flowing: true,
  }
  if (Object.keys(part).length === 0) {
    return h(Popup, custom, 'Sorry, no further part information found.')
  }

  const { image, mpn, specs } = part
  const { number } = mpn?.part
  let orderedSpecs = reorder(specs || [])

  if (!expanded) {
    orderedSpecs = orderedSpecs.slice(0, 4)
  }
  const tableData = specs.map(spec => [spec.name, spec.value])
  const table = h(Table, {
    basic: 'very',
    compact: true,
    tableData,
    renderBodyRow(args) {
      return h(
        Table.Row,
        { key: String(args) },
        args.map(text => {
          return h(Table.Cell, text)
        }),
      )
    },
  })
  let button
  if ((part.specs || []).length > 4) {
    button = h(div, { style: { display: 'flex', justifyContent: 'center' } }, [
      h(
        Button,
        {
          onClick: () => setExpanded(!expanded),
          size: 'tiny',
          basic: true,
        },
        expanded ? '⇡' : '...',
      ),
    ])
  }
  return h(Popup, custom, [
    div({ className: styles.topAreaContainer }, [
      h(
        div,
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        },
        [
          div([
            div({ className: styles.imageContainer }, [
              h(Image, { src: image?.url }),
            ]),
            a(
              { style: { fontSize: 9 }, href: image?.credit_url },
              image?.credit_string,
            ),
          ]),
          h(
            div,
            {
              style: {
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
              },
            },
            [
              a(
                {
                  style: { fontSize: 10 },
                  href: number
                    ? `https://octopart.com/search?q=${number}`
                    : 'https://octopart.com/',
                },
                'Powered by Octopart',
              ),
            ],
          ),
        ],
      ),
      div({ style: { marginLeft: 20 } }, [
        div({ style: { maxWidth: 200 } }, part.description),
        div(
          { style: { marginTop: 15, display: 'flex', justifyContent: 'center' } },
          [
            a({ href: part.datasheet }, [
              h(Icon, { name: 'file pdf outline' }),
              'Datasheet',
            ]),
          ],
        ),
        table,
        button,
      ]),
    ]),
  ])
}

export default MpnPopup
