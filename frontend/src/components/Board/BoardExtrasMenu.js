import React from 'react'
import { Button, Header } from 'semantic-ui-react'

import IBomIcon from './IBomIcon'
import TracespaceIcon from './TracespaceIcon'

const BoardExtraMenus = ({ zipUrl, hasInteractiveBom }) => {
  // TODO figure out what `info.id` stands for.
  const ibomUrl = `/interactive_bom/${'#todo'}`

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
        <Button basic as="a" href={ibomUrl}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Header as="h4">
              <IBomIcon />
              Assembly Guide
            </Header>
            <div>Interactive HTML BOM</div>
          </div>
        </Button>
      )}
    </div>
  )
}

export default BoardExtraMenus
