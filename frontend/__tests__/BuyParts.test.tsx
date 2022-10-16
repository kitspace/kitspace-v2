import { test } from 'vitest'
import { render } from '@testing-library/react'

import BuyParts from '@components/Board/BuyParts'
import fixture from './fixtures/BuyParts.json'

test('skeleton', () => {
  render(
    <BuyParts
      lines={fixture.lines}
      parts={fixture.parts}
      projectFullName="username/name"
    />,
  )
})
