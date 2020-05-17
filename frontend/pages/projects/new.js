import React from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import { Grid, Divider, Input, Button } from 'semantic-ui-react'
import path from 'path'

import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import styles from './new.module.scss'

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
      <div
        className={`${styles.projectsNew} ui two column stackable center aligned grid`}
      >
        <Grid.Row>
          <Grid.Column className={styles.optionColumn}>
            <div>
              <p>Sync an existing Git repository</p>
              <Input
                className={styles.urlInput}
                fluid
                onChange={(e) => setRemoteRepo(e.target.value)}
                placeholder={remoteRepoPlaceHolder}
                value={remoteRepo}
              />
              <Button
                className={styles.syncButton}
                color="green"
                onClick={() => {
                  const clone_addr = remoteRepo || remoteRepoPlaceHolder
                  const repo_name = urlToName(clone_addr)
                  fetch(gitea_public_url + '/repos/migrate?_csrf=' + _csrf, {
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'include',
                    headers: {
                      accept: 'application/json',
                      'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                      clone_addr,
                      uid,
                      repo_name,
                      mirror: false,
                      wiki: false,
                      private: false,
                      pull_requests: false,
                      releases: true,
                    }),
                  })
                }}
              >
                Sync
              </Button>
            </div>
          </Grid.Column>
          <Divider className={styles.divider} vertical>Or</Divider>
          <Grid.Column className={styles.optionColumn}>
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
                onChange={(e) => console.log(e.target.files)}
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
