import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import BuyParts from '@components/Board/BuyParts'
import fixture from './fixtures/BuyParts.json'

beforeEach(() => {
  fetchMock.mockResponse(() =>
    JSON.stringify({
      country_code: 'GB',
    }),
  )
})

it('should display bom', () => {
  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )
  const StoresButtons = screen.getAllByRole('button')
  expect(StoresButtons).toHaveLength(5)
})

it('even if there is no purchasable parts', () => {
  render(
    <BuyParts
      lines={fixture.noPurchasableParts.lines}
      parts={fixture.noPurchasableParts.parts}
      projectFullName="username/name"
    />,
  )

  const NoPurchasableParts = screen.getByText(
    "No parts to buy have been specified in this project's BOM yet.",
  )
  const BomRows = screen.getAllByRole('row')

  expect(NoPurchasableParts).toBeTruthy()
  expect(BomRows).toHaveLength(10)

  screen.getAllByRole('table')[1].click()
  const BomRowsCollapsed = screen.getAllByRole('row')
  expect(BomRowsCollapsed).toHaveLength(63)
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
