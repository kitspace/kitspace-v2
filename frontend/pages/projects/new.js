import React from 'react'
import Link from 'next/link'
import superagent from 'superagent'
import * as semantic from 'semantic-ui-react'
import 'semantic-ui-css/components/segment.css'
import 'semantic-ui-css/components/grid.css'
import 'semantic-ui-css/components/divider.css'
import 'semantic-ui-css/components/input.css'
import 'semantic-ui-css/components/form.css'

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
        <semantic.Grid.Row>
          <semantic.Grid.Column className='optionColumn'>
            <div>
              <p>Sync an existing Git repository</p>
              <semantic.Input
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
          </semantic.Grid.Column>
          <div className="dividerContainer">
            <semantic.Divider vertical>Or</semantic.Divider>
          </div>
          <semantic.Grid.Column className='optionColumn'>
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
                onChange={e => console.log(e)}
              />
            </div>
          </semantic.Grid.Column>
        </semantic.Grid.Row>
      </div>
    </>
  )
}

function getSession(req) {
  if (req != null) {
    return req.session
  }
  if (typeof window !== 'undefined') {
    return window.session
  }
}

New.getInitialProps = async ({ req, query }) => {
  let api = path => gitea_internal_url + path
  if (req == null) {
    api = path => gitea_public_url + path
  }
  const session = getSession(req) || {}
  const cookie = req?.headers?.cookie
  const _csrf = session._csrf

  return {
    name: session?.user?.username || 'unknown user',
    _csrf,
  }
}

export default New
