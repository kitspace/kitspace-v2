import React, { useEffect, useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'
import DoubleScrollBar from 'react-double-scrollbar'

import { array, bool, func, number, string } from 'prop-types'
import styles from './Bom.module.scss'
import TsvTable from './TsvTable'

const Bom = ({ length, parts, tsv }) => {
  const [diff, setDiff] = useState(0)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const collapsedDiff = length - 7
    setDiff(collapsedDiff)

    if (collapsedDiff < 2) {
      setDiff(0)
      setCollapsed(false)
    }
  }, [length])

  return (
    <div className={styles.Bom} data-cy="buy-parts-bom">
      <DoubleScrollBar>
        <TsvTable collapsed={collapsed} parts={parts} tsv={tsv} />
      </DoubleScrollBar>
      {diff !== 0 ? (
        <ExpandBom collapsed={collapsed} diff={diff} setCollapsed={setCollapsed} />
      ) : null}
    </div>
  )
}

const ExpandBom = ({ diff, collapsed, setCollapsed }) => {
  const summary =
    diff > 0 && collapsed ? (
      <tr className={styles.expandSummary}>
        <Table.Cell
          key="diff cell"
          textAlign="center"
        >{`... ${diff} more lines`}</Table.Cell>
      </tr>
    ) : null

  return (
    <div style={{ paddingLeft: 1, paddingRight: 1 }}>
      <Table
        celled
        singleLine
        unstackable
        attached="bottom"
        className={styles.expandBomTable}
        style={{
          borderTop: 0,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <tbody>
          {summary}
          <tr style={{ borderTop: 0 }}>
            <Table.Cell key="collapse cell" textAlign="center">
              <Icon name={collapsed ? 'eye' : 'arrow up'} />
              {collapsed ? 'View all' : 'Hide'}
            </Table.Cell>
          </tr>
        </tbody>
      </Table>
    </div>
  )
}

Bom.propTypes = {
  length: number.isRequired,
  parts: array.isRequired,
  tsv: string.isRequired,
}

ExpandBom.propTypes = {
  diff: number.isRequired,
  collapsed: bool.isRequired,
  setCollapsed: func.isRequired,
}

export default Bom
