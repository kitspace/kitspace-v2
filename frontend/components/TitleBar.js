import React from 'react'
import * as semantic from 'semantic-ui-react'
import Link from 'next/link'

import logoSvg from '!raw-loader!./logo.svg'
import 'semantic-ui-css/components/menu.css'
import 'semantic-ui-css/components/image.css'
import 'semantic-ui-css/components/button.css'
import 'semantic-ui-css/components/icon.css'
import './TitleBar.scss'

const logo = 'data:image/svg+xml;utf-8,' + encodeURIComponent(logoSvg)

export default function TitleBar(props) {
  const isProjectRoute =
    props.route === '/' || RegExp('^/boards/').test(props.route)
  const isSubmitRoute = RegExp('^/submit/').test(props.route)
  return (
    <div className="titleBar">
      <div className="logoContainer">
        <semantic.Menu inverted pointing secondary stackable={false}>
          <Link href="/">
            <a>
              <semantic.Image className="logoImg" src={logo} />
            </a>
          </Link>
          <Link href="/">
            <semantic.Menu.Item as="a" active={isProjectRoute || isSubmitRoute}>
              {'Projects'}
            </semantic.Menu.Item>
          </Link>
          <Link href="/bom-builder">
            <semantic.Menu.Item as="a" active={props.route === '/bom-builder/'}>
              {'BOM Builder'}
            </semantic.Menu.Item>
          </Link>
          <Link href="/1-click-bom">
            <semantic.Menu.Item as="a" active={props.route === '/1-click-bom/'}>
              {'1-click BOM'}
            </semantic.Menu.Item>
          </Link>
        </semantic.Menu>
      </div>
      <div className="rightButtonsContainer">
        <semantic.Menu className="socialMenu" inverted pointing secondary>
          <semantic.Menu.Item
            as="a"
            href="https://riot.im/app/#/room/#kitspace:matrix.org"
          >
            <semantic.Icon name="chat" />
            Chat
          </semantic.Menu.Item>
          <semantic.Menu.Item as="a" href="https://twitter.com/kitspaceorg">
            <semantic.Icon name="twitter" />
            Twitter
          </semantic.Menu.Item>
          <semantic.Menu.Item as="a" href="https://github.com/kitspace">
            <semantic.Icon name="github" />
            GitHub
          </semantic.Menu.Item>
          {isSubmitRoute ? null : (
            <semantic.Menu.Item>
              <semantic.Button icon color="green" href="/submit">
                <semantic.Icon name="plus" />
                Add a project
              </semantic.Button>
            </semantic.Menu.Item>
          )}
        </semantic.Menu>
      </div>
    </div>
  )
}
