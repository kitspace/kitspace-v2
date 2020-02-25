import React from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import { Grid, Divider, Input } from 'semantic-ui-react'
import 'semantic-ui-css/components/grid.css'
import 'semantic-ui-css/components/divider.css'
import 'semantic-ui-css/components/input.css'
import path from 'path'

import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import './new.scss'

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

const gitea_internal_url = 'http://gitea:3000/api/v1'

function New({ user, _csrf }) {
  const [remoteRepo, setRemoteRepo] = React.useState('')
  const remoteRepoPlaceHolder = 'https://github.com/emard/ulx3s'
  const uid = user?.id
  return (
    <>
      <Head />
      <TitleBar route="/projects/new" />
      <div className="ui two column stackable center aligned grid">
        <Grid.Row>
          <Grid.Column className="optionColumn">
            <div>
              <p>Sync an existing Git repository</p>
              <Input
                action={{
                  content: 'Sync',
                  color: 'green',
                  onClick: e => {
                    const clone_addr = remoteRepo || remoteRepoPlaceHolder
                    const repo_name = urlToName(clone_addr)
                    //fetch(gitea_public_url + '/repos/migrate', {
                    //  method: 'POST',
                    //  credentials: 'include',
                    //  headers: {
                    //    'Content-Type': 'application/json',
                    //    Accept: 'application/json',
                    //  },
                    //  body: JSON.stringify({ _csrf, clone_addr, repo_name, uid }),
                    //  mode: 'no-cors',
                    //}).then(r => console.log(r))
                    //superagent
                    //  .post('https://gitea.staging.kitspace.org/api/v1/repos/migrate')
                    //  .withCredentials()
                    //  .query({ _csrf, clone_addr, repo_name, uid })
                    //  .then(r => {
                    //    console.log({ r })
                    //  })
		  fetch("https://gitea.staging.kitspace.org/api/v1/repos/migrate", {
			      "credentials": "include",
			      "headers": {
					      "User-Agent": "Mozilla/5.0 (X11; SunOS sun4u; rv:67.0) Gecko/20100101 Firefox/67.0",
					      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
					      "Accept-Language": "en-GB,en;q=0.5",
					      "Content-Type": "application/x-www-form-urlencoded",
					      "Pragma": "no-cache",
					      "Cache-Control": "no-cache"
					  },
			      "body": `_csrf=${_csrf}&clone_addr=${encodeURIComponent(clone_addr)}&auth_username=&auth_password=&uid=${uid}&repo_name=${repo_name}&description=`,
			      "method": "POST",
			      "mode": "cors"
		  })
	  },
                }}
                className="urlInput"
                fluid
                onChange={e => setRemoteRepo(e.target.value)}
                placeholder={remoteRepoPlaceHolder}
                value={remoteRepo}
              />
            </div>
          </Grid.Column>
          <div className="dividerContainer">
            <Divider vertical>Or</Divider>
          </div>
          <Grid.Column className="optionColumn">
            <div>
              <p>Upload a KiCad folder</p>
              <label className="ui green button" htmlFor="uploadInput">
                Browse...
              </label>
              <input
                multiple
                type="file"
                webkitdirectory=""
                directory=""
                mozdirectory=""
                id="uploadInput"
                style={{ display: 'none' }}
                onChange={e => console.log(e.target.files)}
              />
            </div>
          </Grid.Column>
        </Grid.Row>
      </div>
    </>
  )
}

function getSession(req) {
  let session = {}
  if (req != null && req.session) {
    session = req.session
  } else if (typeof window !== 'undefined' && window.session) {
    session = window.session
  }
  return session
}

function urlToName(url) {
  url = new URL(url)
  return path.basename(url.pathname, path.extname(url.pathname))
}

New.getInitialProps = async ({ req, query }) => {
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    user: session.user,
    _csrf,
  }
}

export default New
