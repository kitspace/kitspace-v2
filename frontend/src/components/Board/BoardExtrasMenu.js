import React from 'react'
import Link from 'next/link'
import { Button, Header } from 'semantic-ui-react'

import { bool, string } from 'prop-types'
import IBomIcon from './IBomIcon'
import TracespaceIcon from './TracespaceIcon'

const BoardExtraMenus = ({ zipUrl, hasInteractiveBom, projectFullname }) => {
  const ibomUrl = `/${projectFullname}/IBOM/`

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
      <Button basic as="a" href={`https://tracespace.io/view/?boardUrl=${zipUrl}`}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Header as="h4">
            <TracespaceIcon />
            Inspect Gerbers
          </Header>
          <div>Tracespace View</div>
        </div>
      </Button>
      {hasInteractiveBom && (
        <Link passHref href={ibomUrl}>
          <Button basic as="a">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Header as="h4">
                <IBomIcon />
                Assembly Guide
              </Header>
              <div>Interactive HTML BOM</div>
            </div>
          </Button>
        </Link>
      )}
    </div>
  )
}

BoardExtraMenus.propTypes = {
  zipUrl: string.isRequired,
  hasInteractiveBom: bool.isRequired,
  projectFullname: string.isRequired,
}

export default BoardExtraMenus
