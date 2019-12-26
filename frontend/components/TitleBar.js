import React from 'react'
import * as semantic from 'semantic-ui-react'

import 'semantic-ui-css/components/menu.css'
import 'semantic-ui-css/components/image.css'
import 'semantic-ui-css/components/button.css'
import 'semantic-ui-css/components/icon.css'
import './TitleBar.scss'

export default function TitleBar(props) {
  const isProjectRoute =
    props.route === '/' || RegExp('^/boards/').test(props.route)
  const isSubmitRoute = RegExp('^/submit/').test(props.route)
  return (
        <div className="titleBar">
          <div className="logoContainer">
            <semantic.Menu inverted pointing secondary stackable={false}>
              <a href="/">
                <semantic.Image className="logoImg" src="/static/logo.svg" />
              </a>
              <semantic.Menu.Item
                as="a"
                href="/"
                active={isProjectRoute || isSubmitRoute}
              >
                {'Projects'}
              </semantic.Menu.Item>
              <semantic.Menu.Item
                as="a"
                href="/bom-builder"
                active={props.route === '/bom-builder/'}
              >
                {'BOM Builder'}
              </semantic.Menu.Item>
              <semantic.Menu.Item
                as="a"
                href="/1-click-bom"
                active={props.route === '/1-click-bom/'}
              >
                {'1-click BOM'}
              </semantic.Menu.Item>
            </semantic.Menu>
          </div>
          <div className="rightButtonsContainer">
            <semantic.Menu
              className="socialMenu"
              inverted
              pointing
              secondary
            >
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
                  <semantic.Button
                    icon
                    color="green"
                    href="/submit"
                  >
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
