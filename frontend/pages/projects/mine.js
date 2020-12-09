import React, { useState, useEffect, useContext } from 'react'

import { Page } from '@/components/Page'
import { getUserRepos } from '@utils/giteaApi'
import { AuthContext } from '@/contexts/AuthContext'

const Mine = () => {
  const { csrf } = useContext(AuthContext)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const getUserProjects = async () => {
      const repos = await getUserRepos(csrf)
      setProjects(repos)
    }

    if (csrf) {
      getUserProjects().then()
    }
  }, [csrf])

  useEffect(() => {
    console.log(projects)
  })

  return <Page>
  </Page>
}

export default Mine
