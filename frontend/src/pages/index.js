import React, { useContext, useState, useEffect } from 'react'
import superagent from 'superagent'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import { getSession, getRepos } from '@utils/giteaApi'

const Home = ({ repos }) => {
  const { user, csrf } = useContext(AuthContext)
  const username = user?.login || 'unknown user'
  const [projects, setProjects] = useState([])

  useEffect(() => {
    if (csrf) {
      getRepos(csrf).then(setProjects)
    }
  }, [csrf])

  return (
    <Page title="home">
      <div>
        Hi there {username}
        <pre>{JSON.stringify(projects, null, 2)}</pre>
      </div>
    </Page>
  )
}

export default Home
