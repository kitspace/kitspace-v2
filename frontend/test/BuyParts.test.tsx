import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

import BuyParts, { calculateQuantity } from '@components/Board/BuyParts'
import fixture from './fixtures/BuyParts.json'

beforeEach(() => {
  const mockPlausible = vi.fn()
  window.plausible = mockPlausible
  URL.createObjectURL = vi.fn().mockReturnValue('mocked-url')
  fetchMock.mockResponse(() =>
    JSON.stringify({
      country_code: 'GB',
    }),
  )
})

it('displays BuyParts', () => {
  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )
  const StoresButtons = screen.getAllByRole('button')
  expect(StoresButtons).toHaveLength(6)
})

it('still displays BuyParts if there are no purchasable parts', async () => {
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
  const BomRows = screen.getAllByTestId('bom-row')

  expect(NoPurchasableParts).toBeTruthy()
  expect(BomRows).toHaveLength(7)

  screen.getByText('View all').click()
  await waitFor(() => {
    const BomRowsExpanded = screen.getAllByTestId('bom-row')
    expect(BomRowsExpanded).toHaveLength(61)
  })
})

it('tracks bom download', async () => {
  const mockPlausible = vi.fn()
  window.plausible = mockPlausible

  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )
  const storeButton = screen.getAllByRole('button').at(-1)
  storeButton.click()

  expect(mockPlausible).toHaveBeenCalledWith('Buy Parts', {
    props: {
      project: 'username/name',
      vendor: expect.any(String),
      multiplier: expect.any(Number),
    },
  })

  mockPlausible.mockRestore()
})

it('downloads `*-kitspace-bom.csv` on click', async () => {
  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )

  // Mock anchor element and simulate the CSV download behavior
  const mockLinkElement = {
    setAttribute: vi.fn(),
  }
  const mockElementWithId = document.createElement('div')
  mockElementWithId.closest = vi.fn().mockReturnValue(mockLinkElement)

  const mockGetElementById = vi
    .spyOn(document, 'getElementById')
    .mockReturnValue(mockElementWithId)

  const storeButton = screen.getAllByRole('button').at(-1)
  storeButton.click()

  expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('href', 'mocked-url')
  expect(mockLinkElement.setAttribute).toHaveBeenCalledWith(
    'download',
    expect.stringContaining('kitspace-bom.csv'),
  )

  // cleanup
  mockGetElementById.mockRestore()
})

it("redirects to Digikey's website on click", async () => {
  const mockSubmit = vi.fn()
  HTMLFormElement.prototype.submit = mockSubmit

  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )
  const storeButtons = screen
    .getAllByRole('button')
    .map(button =>
      button.nextElementSibling.firstElementChild.id.replace('retailer-', ''),
    )
  const digikeyButton = screen
    .getAllByRole('button')
    .at(storeButtons.indexOf('Digikey'))
    .closest('a')

  digikeyButton.click()
  expect(mockSubmit).toHaveBeenCalled()
})

it('calculates the order quantity', () => {
  expect(calculateQuantity(1, 1, 0)).toBe(1)
  expect(calculateQuantity(10, 2, 0)).toBe(20)
  expect(calculateQuantity(10, 2, 10)).toBe(22)
  expect(calculateQuantity(1, 1, 10)).toBe(2)
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
