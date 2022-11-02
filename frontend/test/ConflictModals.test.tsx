import { afterEach, beforeAll, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import { SyncConflictModal } from '@components/NewProject/ConflictModals'
import AuthProvider from '@contexts/AuthContext'
import GET_REPO from './fixtures/GetRepoRes.json'

beforeAll(() => {
  vi.mock('next/config', () => ({
    default: () => ({
      publicRuntimeConfig: {
        KITSPACE_GITEA_URL: 'https://gitea.kitspace.test',
      },
    }),
  }))

  vi.mock('next/router', () => require('next-router-mock'))

  fetchMock.mockResponse(req => {
    if (req.url === 'https://gitea.kitspace.test/api/v1/repos/tester/test_repo') {
      return JSON.stringify(GET_REPO)
    }
  })
})

it('displays ConflictModal', () => {
  render(
    <AuthProvider initialSession={{ user: { username: 'tester' } }}>
      <SyncConflictModal
        conflictModalOpen={true}
        originalProjectName="test_repo"
        onClose={() => {}}
        onDifferentName={() => {}}
        onOverwrite={() => {}}
      />
    </AuthProvider>,
  )
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
