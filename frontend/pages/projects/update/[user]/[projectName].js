import React from 'react'

import { useRouter } from 'next/router'
import { Page } from '@/components/Page'

const UpdateProject = () => {
  const router = useRouter()
  const { user, projectName } = router.query

  return (
    <Page>
      <p>
        Updating {projectName} by {user}
      </p>
    </Page>
  )
}

export default UpdateProject
