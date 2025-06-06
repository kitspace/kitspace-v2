import { useEffect, useState } from 'react'
import { Icon, Table } from 'semantic-ui-react'

import styles from './Bom.module.scss'
import TsvTable from './TsvTable'

const Bom = ({ length, parts, tsv }: BomProps) => {
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
      <div style={{ overflow: 'scroll' }}>
        <TsvTable collapsed={collapsed} parts={parts} tsv={tsv} />
      </div>
      {diff !== 0 ? (
        <ExpandBom collapsed={collapsed} diff={diff} setCollapsed={setCollapsed} />
      ) : null}
    </div>
  )
}

const ExpandBom = ({ diff, collapsed, setCollapsed }: ExpandBomProps) => {
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
    <div className={styles.expandWrapper}>
      <Table
        celled
        singleLine
        unstackable
        attached="bottom"
        className={styles.expandTable}
        style={{
          borderTop: 0,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <tbody>
          {summary}
          <tr className={`${styles.expandTableRow}`}>
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

interface BomProps {
  length: number
  parts: Array<any>
  tsv: string
}

interface ExpandBomProps {
  diff: number
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export default Bom
