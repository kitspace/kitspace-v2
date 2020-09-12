import React from 'react'
import Link from 'next/link'
import { Button, Icon, Image, Menu, Popup } from 'semantic-ui-react'

import styles from './TitleBar.module.scss'

const logoSrc = '/static/logo.svg'

export default function NavBar(props) {
  const isAuthenticated = props.auth
  const isSubmitRoute = RegExp('^/projects/new').test(props.route)
  const isProjectRoute =
    isSubmitRoute || props.route === '/' || RegExp('^/projects/').test(props.route)
  return (
    <div className={styles.titleBar}>
      <div className={styles.bigSiteMenu}>
        <Menu inverted pointing secondary>
          {/*<Link href="/">*/}
          {/*  <Image className={styles.logoImg} src={logoSrc} />*/}
          {/*</Link>*/}
          <SiteMenuItems route={props.route} isProjectRoute={isProjectRoute} />
        </Menu>
      </div>
      <div className={styles.bigSocialMenu}>
        <Menu inverted pointing secondary>
          {isSubmitRoute || !isAuthenticated ? (
            <ContactMenu />
          ) : (
            <AddAProjectButton />
          )}
          <SigningButton auth={props.auth} />
        </Menu>
      </div>
      <div className={styles.smallMenu}>
        {/*<Link href="/">*/}
        {/*  <Image className="logoImg" src="/images/logo.svg" />*/}
        {/*</Link>*/}
        <Popup
          trigger={
            <Button icon size="large" basic inverted>
              <Icon inverted name="bars" />
            </Button>
          }
          on="click"
          position="bottom right"
          inverted
          basic
        >
          <Menu inverted vertical>
            <SiteMenuItems route={props.route} isProjectRoute={isProjectRoute} />
            <SocialMenuItems />
            {isSubmitRoute ? null : <AddAProjectButton />}
          </Menu>
        </Popup>
      </div>
    </div>
  )
}

function AddAProjectButton() {
  return (
    <Menu.Item>
      <Button icon labelPosition="left" color="green" href="/projects/new">
        <Icon name="plus" />
        Add a project
      </Button>
    </Menu.Item>
  )
}

function SiteMenuItems(props) {
  return (
    <>
      <Menu.Item as="a" href="/" active={props.isProjectRoute}>
        {'Projects'}
      </Menu.Item>
      <Menu.Item
        as="a"
        href="/bom-builder"
        active={props.route === '/bom-builder/'}
      >
        {'BOM Builder'}
      </Menu.Item>
      <Menu.Item
        as="a"
        href="/1-click-bom"
        active={props.route === '/1-click-bom/'}
      >
        {'1-click BOM'}
      </Menu.Item>
    </>
  )
}

function SocialMenuItems() {
  return (
    <>
      <Menu.Item as="a" href="https://riot.im/app/#/room/#kitspace:matrix.org">
        <Icon name="chat" />
        Chat
      </Menu.Item>
      <Menu.Item as="a" href="/newsletter/">
        <Icon name="envelope" />
        Email & Newsletter
      </Menu.Item>
      <Menu.Item as="a" href="https://twitter.com/kitspaceorg">
        <Icon name="twitter" />
        Twitter
      </Menu.Item>
      <Menu.Item as="a" href="https://github.com/kitspace">
        <Icon name="github" />
        GitHub
      </Menu.Item>
      <Menu.Item as="a" href="https://opencollective.com/kitspace">
        <Icon name="heart" />
        Donate
      </Menu.Item>
    </>
  )
}

function ContactMenu() {
  return (
    <Popup
      trigger={
        <Menu.Item className="contact-button">
          <Button labelPosition="right" icon color="blue">
            <Icon inverted name="comments" />
            {/* just here to force the loading of
                brand-icons before the menu is visible */}
            <Icon
              name="twitter"
              style={{ visibility: 'hidden', width: '0px', height: '0px' }}
            />
            Make contact
          </Button>
        </Menu.Item>
      }
      on="click"
      position="bottom right"
      color="blue"
    >
      <Menu secondary vertical>
        <SocialMenuItems />
      </Menu>
    </Popup>
  )
}

function SigningButton(props) {
  const isAuthenticated = props.auth
  return (
    <Menu.Item>
      <Button color={isAuthenticated ? 'red' : 'green'} href="#">
        {isAuthenticated ? 'Sign out' : 'Sign in'}
      </Button>
    </Menu.Item>
  )
}
