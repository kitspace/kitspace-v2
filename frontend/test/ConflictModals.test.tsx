import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { SyncConflictModal } from '@components/NewProject/ConflictModals'

it('displays BuyParts', () => {
  render(
    <SyncConflictModal
      conflictModalOpen={true}
      onClose={() => {}}
      originalProjectName="test"
      onDifferentName={() => {}}
      onOverwrite={() => {}}
    />,
  )
})

afterEach(() => {
  cleanup()
  fetchMock.resetMocks()
})
