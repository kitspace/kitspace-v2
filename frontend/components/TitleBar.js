import React from 'react'
import * as semantic from 'semantic-ui-react'
import Link from 'next/link'

import logo from './logo.svg'
import 'semantic-ui-css/components/menu.css'
import 'semantic-ui-css/components/image.css'
import 'semantic-ui-css/components/button.css'
import 'semantic-ui-css/components/icon.css'
import 'semantic-ui-css/components/popup.css'
import './TitleBar.scss'


export default function TitleBar(props) {
  const isSubmitRoute = RegExp('^/projects/new').test(props.route)
  const isProjectRoute =
    isSubmitRoute || props.route === '/' || RegExp('^/projects/').test(props.route)
  return (
    <div className="titleBar">
      <div className="bigSiteMenu">
        <semantic.Menu inverted pointing secondary>
          <Link href="/">
            <a>
              <semantic.Image className="logoImg" src={logo} />
            </a>
          </Link>
          <SiteMenuItems route={props.route} isProjectRoute={isProjectRoute} />
        </semantic.Menu>
      </div>
      <div className="bigSocialMenu">
        <semantic.Menu inverted pointing secondary>
          <SocialMenuItems isSubmitRoute={isSubmitRoute} />
        </semantic.Menu>
      </div>
      <div className="smallMenu">
        <Link href="/">
          <a>
            <semantic.Image className="logoImg" src={logo} />
          </a>
        </Link>
        <semantic.Popup
          trigger={
            <semantic.Button icon size="large" basic inverted>
              <semantic.Icon inverted name="bars" />
            </semantic.Button>
          }
          on="click"
          position="bottom right"
          inverted
          basic
        >
          <semantic.Menu inverted vertical>
            <SiteMenuItems route={props.route} isProjectRoute={isProjectRoute} />
            <SocialMenuItems isSubmitRoute={isSubmitRoute} />
          </semantic.Menu>
        </semantic.Popup>
      </div>
    </div>
  )
}

function SiteMenuItems(props) {
  return (
    <>
      <Link href="/" passHref>
        <semantic.Menu.Item as="a" active={props.isProjectRoute}>
          {'Projects'}
        </semantic.Menu.Item>
      </Link>
      <Link href="/bom-builder" passHref>
        <semantic.Menu.Item as="a" active={props.route === '/bom-builder/'}>
          {'BOM Builder'}
        </semantic.Menu.Item>
      </Link>
      <Link href="/1-click-bom" passHref>
        <semantic.Menu.Item as="a" active={props.route === '/1-click-bom/'}>
          {'1-click BOM'}
        </semantic.Menu.Item>
      </Link>
    </>
  )
}

function SocialMenuItems(props) {
  return (
    <>
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
      <semantic.Menu.Item as="a" href="https://opencollective.com/kitspace">
        <semantic.Icon name="heart" />
        Donate
      </semantic.Menu.Item>
      {props.isSubmitRoute ? null : (
        <semantic.Menu.Item>
          <semantic.Button
            icon
            labelPosition="left"
            color="green"
            href="/projects/new"
          >
            <semantic.Icon name="plus" />
            Add a project
          </semantic.Button>
        </semantic.Menu.Item>
      )}
    </>
  )
}
