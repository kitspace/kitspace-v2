import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import Search from '@pages/search'
import SearchProvider from '@contexts/SearchContext'

import IntroFixture from './fixtures/Intro.json'

beforeAll(() => {
  vi.mock('next/config', () => ({
    default: () => ({
      publicRuntimeConfig: {
        KITSPACE_GITEA_URL: 'https://gitea.kitspace.test',
        KITSPACE_PROCESSOR_ASSET_URL: 'https://example.s3.amazonaws.com/',
      },
    }),
  }))

  vi.mock('next/router', () => require('next-router-mock'))
})

it('removes the intro text on submitting a search query', async () => {
  // IPhone 12 Pro, for testing the mobile view
  window.innerWidth = 390
  window.innerHeight = 844

  const screen = render(
    <SearchProvider initialQuery="">
      <Search swrFallback={{}} />
    </SearchProvider>,
  )
  const searchInput = screen.getAllByPlaceholderText(
    'Search for projects',
  )[0] as HTMLInputElement

  const intro = screen.getByText(IntroFixture.Text)
  // The intro text should be visible
  expect(intro).toBeTruthy()

  //Submit a search query
  fireEvent.change(searchInput, { target: { value: 'foo' } })
  fireEvent.submit(searchInput)

  // The intro text should be removed
  await waitFor(() => {
    expect(screen.queryByText(IntroFixture.Text)).toBeFalsy()
  })
})

afterEach(() => cleanup())
