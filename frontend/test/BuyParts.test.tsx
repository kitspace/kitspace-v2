import { afterEach, beforeEach, expect, it, vi } from 'vitest'
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

it('displays BuyParts', () => {
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

it('still displays BuyParts if there are no purchasable parts', () => {
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

it('downloads `kitspace-bom.csv` on click', async () => {
  const mockPlausible = vi.fn()
  window.plausible = mockPlausible // Mocking plausible method

  // Mock the createObjectURL and link click functionality
  const mockCreateObjectURL = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('mocked-url')
  const mockClick = vi.fn()

  render(
    <BuyParts
      lines={fixture.purchasableParts.lines}
      parts={fixture.purchasableParts.parts}
      projectFullName="username/name"
    />,
  )

  const storeButton = screen.getAllByRole('button').at(-1)

  // Mock anchor element and simulate the CSV download behavior
  const mockLinkElement = {
    setAttribute: vi.fn(),
    click: mockClick,
  }
  const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
    closest: vi.fn().mockReturnValue({
      parentElement: mockLinkElement,
    }),
  } as unknown as HTMLElement)

  // Simulate button click
  storeButton.click()

  expect(mockPlausible).toHaveBeenCalledWith('Buy Parts', {
    props: {
      project: 'username/name',
      vendor: expect.any(String),
      multiplier: expect.any(Number),
    },
  })
  expect(mockCreateObjectURL).toHaveBeenCalledOnce() // Check if the URL was created
  expect(mockLinkElement.setAttribute).toHaveBeenCalledWith('href', 'mocked-url')
  expect(mockLinkElement.setAttribute).toHaveBeenCalledWith(
    'download',
    expect.stringContaining('kitspace-bom.csv'),
  )
  expect(mockClick).toHaveBeenCalledOnce() // Check if the link click was triggered

  // cleanup
  mockCreateObjectURL.mockRestore()
  mockGetElementById.mockRestore()
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
