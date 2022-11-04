import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'

import Sync from '@components/NewProject/Sync'
import AuthProvider from '@contexts/AuthContext'

import GetRepo from './fixtures/GetRepoRes.json'
import { SyncConflictModal } from '@components/NewProject/ConflictModals'

const SESSION = { user: { username: 'tester' } }

beforeAll(() => {
  vi.mock('next/config', () => ({
    default: () => ({
      publicRuntimeConfig: {
        KITSPACE_GITEA_URL: 'https://gitea.kitspace.test',
      },
    }),
  }))

  vi.mock('next/router', () => require('next-router-mock'))
})

beforeEach(() => {
  const GITEA_URL = 'https://gitea.kitspace.test'
  fetchMock.mockResponse(req => {
    switch (req.url) {
      case `${GITEA_URL}/api/v1/repos/tester/test_repo`:
        return JSON.stringify(GetRepo)
      case `${GITEA_URL}/api/v1/repos/migrate`:
        return { status: 409 }
      case `${GITEA_URL}/api/v1/repos/tester/new_test_repo`:
        return { status: 404 }
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

it('changes the overwrite button to OK if the new project name does not cause conflict', async () => {
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
  // Wait the modal to appear.
  await screen.findByText('Heads up!')

  const conflictModalInput = screen.getAllByRole('textbox')[1] as HTMLInputElement
  // Change the project name.
  fireEvent.change(conflictModalInput, {
    target: { value: 'new_test_repo' },
  })

  // The button should say OK because we have changed the project name.
  expect(screen.getByText('OK')).toBeTruthy()
})

it('overwrites the repo if the user clicks on `Overwrite`', () => {
  const onClose = vi.fn()
  const onDifferentName = vi.fn()
  const onOverwrite = vi.fn()

  const screen = render(
    <AuthProvider initialSession={SESSION}>
      <SyncConflictModal
        conflictModalOpen={true}
        originalProjectName="test_repo"
        onClose={onClose}
        onDifferentName={onDifferentName}
        onOverwrite={onOverwrite}
      />
    </AuthProvider>,
  )
  fireEvent.click(screen.getByText('Overwrite'))
  expect(onOverwrite).toHaveBeenCalled()
})

it('creates a repo with a different name if the user the conflicting name and clicks `OK`', async () => {
  const onClose = vi.fn()
  const onDifferentName = vi.fn()
  const onOverwrite = vi.fn()

  const screen = render(
    <AuthProvider initialSession={SESSION}>
      <SyncConflictModal
        conflictModalOpen={true}
        originalProjectName="test_repo"
        onClose={onClose}
        onDifferentName={onDifferentName}
        onOverwrite={onOverwrite}
      />
    </AuthProvider>,
  )

  const conflictModalInput = screen.getAllByRole('textbox')[0]

  fireEvent.change(conflictModalInput, {
    target: { value: 'new_test_repo' },
  })

  // Wait for the button to be enabled
  await waitFor(() =>
    expect(screen.getByText('OK')).toHaveProperty('disabled', false),
  )

  fireEvent.click(screen.getByText('OK'))
  expect(onDifferentName).toHaveBeenCalled()
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
