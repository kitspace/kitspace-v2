import React from 'react'
import Link from 'next/link'
import Head from '../components/head'
import Nav from '../components/nav'
import superagent from 'superagent'

const Home = ({ name, _csrf, repos }) => (
  <div>
    Hi there {name}, {_csrf}
    <pre>{JSON.stringify(repos, null, 2)}</pre>
  </div>
)

function api(path) {
  return 'http://gitea:3000/api/v1' + path
}

Home.getInitialProps = async ({ req }) => {
   
  const cookie = req.headers.cookie
  const session = req.session || {}
  const _csrf = session.Csrf
  let get = superagent
    .get(api('/repos/search'))
    .query({ sort: 'updated', order: 'desc' })
    .query({ _csrf })
    .set(cookie ? { cookie } : {})
    .then(r => r.body.data)
  let repos = await get
  console.log({repos})

  repos = await Promise.all(
    repos.map(async repo => {
      let head = null
      if (!repo.empty) {
        const branch = repo.default_branch
        const refs = await superagent
          .get(api(`/repos/${repo.full_name}/git/refs`))
          .query({ _csrf })
          .set(cookie ? { cookie } : {})
          .then(r => r.body)
        const ref = refs.find(r => r.ref === `refs/heads/${branch}`)
        head = ref && ref.object.sha
      }
      return { head, ...repo }
    }),
  )

  return {
    name: (session.User || {}).Name || 'unknown user',
    _csrf,
    repos,
  }
}

export default Home
