import React from 'react'
import superagent from 'superagent'

import { Page } from '../components/Page'

function Home({ name, _csrf, repos }) {
  return (
    <Page title="home">
      <div>
        Hi there {name}, {_csrf}
        <pre>{JSON.stringify(repos, null, 2)}</pre>
      </div>
    </Page>
  )
}

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

const gitea_internal_url = 'http://gitea:3000/api/v1'

Home.getInitialProps = async ({ req }) => {
  let api = path => gitea_internal_url + path
  if (req == null) {
    api = path => gitea_public_url + path
  }
  const session = process.browser ? window.session : {}

  const cookie = req?.headers?.cookie
  const _csrf = session._csrf
  let repos = await superagent
    .get(api('/repos/search'))
    .query({ sort: 'updated', order: 'desc' })
    .query({ _csrf })
    .set(cookie ? { cookie } : {})
    .then(r => r.body.data)

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
    name: session?.user?.username || 'unknown user',
    _csrf,
    repos,
  }
}

export default Home
