import React, { useEffect, useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'
import DoubleScrollBar from 'react-double-scrollbar'

import styles from './Bom.module.scss'
import TsvTable from './TsvTable'

const Bom = ({ length, parts, tsv }) => {
  const [diff, setDiff] = useState(0)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    const diff = length - 7
    setDiff(diff)

    if (diff < 2) {
      setDiff(0)
      setCollapsed(false)
    }
  }, [length])

  return (
    <div className={styles.Bom}>
      <DoubleScrollBar>
        <TsvTable parts={parts} tsv={tsv} collapsed={collapsed} />
      </DoubleScrollBar>
      {diff !== 0 ? (
        <ExpandBom diff={diff} collapsed={collapsed} setCollapsed={setCollapsed} />
      ) : null}
    </div>
  )
}

const ExpandBom = ({ diff, collapsed, setCollapsed }) => {
  const summary =
    diff > 0 && collapsed ? (
      <tr className={styles.expandSummary}>
        <Table.Cell textAlign="center">{`... ${diff} more lines`}</Table.Cell>
      </tr>
    ) : null

  return (
    <div style={{ paddingLeft: 1, paddingRight: 1 }}>
      <Table
        className={styles.expandBomTable}
        attached="bottom"
        celled
        singleLine
        unstackable
        style={{
          borderTop: 0,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <tbody>
          {summary}
          <tr style={{ borderTop: 0 }}>
            <Table.Cell textAlign="center">
              <Icon name={collapsed ? 'eye' : 'arrow up'} />
              {collapsed ? 'View all' : 'Hide'}
            </Table.Cell>
          </tr>
        </tbody>
      </Table>
    </div>
  )
}

export default Bom
