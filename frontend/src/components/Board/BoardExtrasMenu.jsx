import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Header } from 'semantic-ui-react'

import { bool, string } from 'prop-types'
import IBomIcon from './IBomIcon'
import TracespaceIcon from './TracespaceIcon'

const BoardExtraMenus = ({ zipUrl, hasInteractiveBom, interactiveBomPath }) => {
  const { asPath } = useRouter()
  const ibomUrl = `${asPath}/${interactiveBomPath}`

  return (
    <div
      data-cy="board-extra-menus"
      style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}
    >
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
        <Link legacyBehavior passHref href={ibomUrl}>
          <Button basic as="a" data-cy="ibom">
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
  interactiveBomPath: string.isRequired,
}

export default BoardExtraMenus
