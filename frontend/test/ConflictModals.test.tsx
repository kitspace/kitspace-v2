import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'

import Sync from '@components/NewProject/Sync'
import AuthProvider from '@contexts/AuthContext'

import GetRepo from './fixtures/GetRepoRes.json'

const SESSION = { user: { username: 'tester' } }

beforeAll(() => {
  const GITEA_URL = 'https://gitea.kitspace.test'

  vi.mock('next/config', () => ({
    default: () => ({
      publicRuntimeConfig: {
        KITSPACE_GITEA_URL: 'https://gitea.kitspace.test',
      },
    }),
  }))

  vi.mock('next/router', () => require('next-router-mock'))

  fetchMock.mockResponse(req => {
    switch (req.url) {
      case `${GITEA_URL}/api/v1/repos/tester/test_repo`:
        return JSON.stringify(GetRepo)
      case `${GITEA_URL}/api/v1/repos/migrate`:
        return { status: 409 }
      default:
        throw new Error(`Unhandled request: ${req.url}`)
    }
  })
})

it('opens conflict modal if the project name conflict with existing project', async () => {
  const setUserOp = vi.fn()
  const screen = render(
    <AuthProvider initialSession={SESSION}>
      <Sync setUserOp={setUserOp} />
    </AuthProvider>,
  )

  // Write the url in the input
  const input = screen.getAllByRole('textbox')
  fireEvent.change(input[0], {
    target: { value: 'https://github.com/kitspace-test-repos/test_repo' },
  })

  // Click the Sync button
  fireEvent.click(screen.getByText('Sync'))
  // Wait the modal to appear
  await screen.findByText('Heads up!')
  // It should set the userOp to sync
  expect(setUserOp).toHaveBeenCalled()

  // The conflict modal form should have the project name
  const conflictModalInput = screen.getAllByRole('textbox')[1] as HTMLInputElement
  expect(conflictModalInput.value).toBe('test_repo')
  // The button should say overwrite because we haven't changed the project name yet.
  expect(screen.getByText('Overwrite')).toBeTruthy()
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
