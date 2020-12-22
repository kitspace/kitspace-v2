import React, { useContext, useState, useEffect } from 'react'

import { Page } from '@components/Page'
import { AuthContext } from '@contexts/AuthContext'
import { getSession, getRepos } from '@utils/giteaApi'

const processorUrl = `${process.env.KITSPACE_PROCESSOR_URL}/files/`

const Home = ({ repos }) => {
  const { user, csrf } = useContext(AuthContext)
  const username = user?.login || 'unknown user'
  const [projects, setProjects] = useState([])

  useEffect(() => {
    const getProjects = async () => {
      let projects = await getRepos(csrf)
      projects = await Promise.all(
        projects.map(p => {
          console.log({ p })
          return fetch(processorUrl + p.full_name + '/HEAD/images/top.png', {
            mode: 'cors',
          }).then(r => ({
            ...p,
            thumbnail: { status: r.status },
          }))
        }),
      )
      setProjects(projects)
    }
    getProjects()
  }, [])

  useEffect(() => {}, [projects])

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
