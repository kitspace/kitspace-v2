import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/router'
import Error from 'next/error'
import { Page } from '@/components/Page'

const getProject = async fullname => {
  const giteaApiUrl = `${process.env.KITSPACE_GITEA_URL}/api/v1`
  const repoUrl = `${giteaApiUrl}/repos/${fullname}`

  const res = await fetch(repoUrl, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.ok ? await res.json() : null
}

const UpdateProject = () => {
  const router = useRouter()
  const { user, projectName } = router.query
  const [project, setProject] = useState({})

  const fullname = `${user}/${projectName}`

  useEffect(() => {
    const getRepo = async () => {
      const project = await getProject(fullname)
      setProject(project)
    }

    getRepo().then()
  }, [])

  return project != null ? (
    <Page>
      <p>
        Updating {projectName} by {user}
      </p>
    </Page>
  ) : (
    // limit the rendering of this page for already existing repos
    <Error statusCode={404} />
  )
}

export default UpdateProject
