import React from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import { Grid, Divider, Form, Input } from 'semantic-ui-react'
import 'semantic-ui-css/components/grid.css'
import 'semantic-ui-css/components/divider.css'
import 'semantic-ui-css/components/form.css'
import 'semantic-ui-css/components/input.css'

import Head from '../../components/Head'
import TitleBar from '../../components/TitleBar'

import './new.scss'

const gitea_public_url = `${process.env.KITSPACE_GITEA_URL}/api/v1`

const gitea_internal_url = 'http://gitea:3000/api/v1'

function New({ name, _csrf }) {
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
                  onClick: e => console.log(e),
                }}
                className="urlInput"
                fluid
                onChange={e => console.log(e)}
                placeholder="https://github.com/emard/ulx3s"
                value=""
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

New.getInitialProps = async ({ req, query }) => {
  const api = req ? gitea_internal_url : gitea_public_url
  const session = getSession(req)
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    name: session.user?.username || 'unknown user',
    _csrf,
  }
}

export default New
