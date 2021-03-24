import React, { useState } from 'react'
import { Table } from 'semantic-ui-react'
import { flattenDeep } from 'lodash'
import { h, tbody } from 'react-hyperscript-helpers'

import MpnPopup from './MpnPopup'
import styles from './TsvTable'

const markerColor = ref => {
  if (/^C\d/.test(ref)) {
    return 'orange'
  }
  if (/^R\d/.test(ref)) {
    return 'lightblue'
  }
  if (/^IC\d/.test(ref) || /^U\d/.test(ref)) {
    return 'blue'
  }
  if (/^L\d/.test(ref)) {
    return 'black'
  }
  if (/^D\d/.test(ref)) {
    return 'green'
  }
  if (/^LED\d/.test(ref)) {
    return 'yellow'
  }
  return 'purple'
}

const TsvTable = ({ parts, tsv, collapsed }) => {
  const [activePopup, setActivePopup] = useState(null)

  const mpnCells = (contents, rowIndex, columnIndex) => {
    const active =
      activePopup && activePopup[0] === rowIndex && activePopup[1] === columnIndex
    const cells = contents.map(t => h(Table.Cell, { active }, t))
    const number = contents[1]
    if (number !== '') {
      const part =
        parts.reduce((prev, part) => {
          if (prev) {
            return prev
          }
          if (part && part.mpn && part.mpn.part === number) {
            return part
          }
        }, null) || {}
      return cells.map(cell => {
        return h(MpnPopup, {
          onOpen: () => setActivePopup([rowIndex, columnIndex]),
          onClose: () => setActivePopup(null),
          trigger: cell,
          part: part,
        })
      })
    }
    return cells
  }

  const lines = tsv
    .split('\n')
    .slice(0, -1)
    .map(line => line.split('\t'))
  let columns = lines.slice(1).reduce(
    (prev, line) => {
      return prev.map((column, index) => {
        return column.concat([line[index]])
      })
    },
    lines[0].map(t => [t]),
  )

  //get rid of empty columns
  columns = columns.filter(column => {
    //always keep Manufacturer though
    if (column[0] === 'Manufacturer') {
      return true
    }
    return column.slice(1).filter(x => x).length
  })

  const numberOfLines = collapsed ? 8 : undefined
  const reducedLines = columns.slice(1).reduce(
    (prev, column) => {
      return prev.map((line, index) => {
        return line.concat([column[index]])
      })
    },
    columns[0].slice(0, numberOfLines).map(c => [c]),
  )

  const headings = reducedLines[0]
  const bodyLines = reducedLines.slice(1)
  let headingJSX = headings.map(text => h(Table.HeaderCell, text))
  headingJSX = h(Table.Header, [h(Table.Row, headingJSX)])
  const bodyLinesJSX = bodyLines.map((line, rowIndex) => {
    const grouped = line.reduce((grouped, text, columnIndex) => {
      const heading = headings[columnIndex]
      if (heading === 'Manufacturer') {
        return grouped.concat([[text]])
      }
      if (heading === 'MPN') {
        grouped[grouped.length - 1].push(text)
        return grouped
      }
      return grouped.concat([text])
    }, [])
    const groupedHeadings = headings.filter(h => h !== 'Manufacturer')
    function markPink(columnIndex) {
      //mark pink empty cells in all columns except these
      return ['Description'].indexOf(groupedHeadings[columnIndex]) < 0
    }
    const bodyCells = grouped.map((contents, columnIndex) => {
      if (typeof contents === 'object') {
        return mpnCells(contents, rowIndex, columnIndex)
      }
      const error = markPink(columnIndex) && contents === ''
      const className =
        columnIndex === 0 ? `${styles.marked} ${styles[markerColor(contents)]}` : ''
      const cell = h(
        Table.Cell,
        {
          error,
          className,
        },
        contents,
      )
      return cell
    })
    const rowActivePopup = activePopup && activePopup[0] === rowIndex
    const className = rowActivePopup ? styles.selected : ''
    return h(Table.Row, { className }, flattenDeep(bodyCells))
  })

  const bodyJSX = tbody(bodyLinesJSX)
  const tableProps = {
    selectable: !activePopup,
    celled: true,
    unstackable: true,
    singleLine: true,
    size: 'small',
    className: styles.TsvTable + (collapsed ? styles.collapsed : ''),
  }
  return h(Table, tableProps, [headingJSX, bodyJSX])
}

export default TsvTable
