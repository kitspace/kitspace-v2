import React, { useEffect } from 'react'
import { Icon, Tab, Table } from 'semantic-ui-react'
import DoubleScrollBar from 'react-double-scrollbar'

import styles from './Bom.module.scss'
import TsvTable from './TsvTable'

const Bom = ({ length, collapsed, parts, tsv }) => {
  useEffect(() => {})
  let diff = length - 7
  if (diff < 2) {
    diff = 0
    collapsed = false
  }

  return (
    <div className={styles.Bom}>
      <DoubleScrollBar>
        <TsvTable parts={parts} tsv={tsv} collapsed={collapsed} />
      </DoubleScrollBar>
      <ExpandBom diff={diff} collapsed={collapsed} setCollapsed={collapsed} />
    </div>
  )
}

const ExpandBom = ({ diff, collapsed, setCollapsed }) => {
  return diff > 0 && collapsed ? (
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
          <tr className={styles.expandSummary}>
            <Table.Cell textAlign="center">{`... ${diff} more lines`}</Table.Cell>
          </tr>
          <tr style={{ borderTop: 0 }}>
            <Table.Cell textAlign="center">
              <Icon name={collapsed ? 'eye' : 'arrow up'} />
              {collapsed ? 'View all' : 'Hide'}
            </Table.Cell>
          </tr>
        </tbody>
      </Table>
    </div>
  ) : (
    <div />
  )
}

export default Bom
