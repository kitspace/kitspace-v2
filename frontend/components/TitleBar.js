import React from 'react'
import Link from 'next/link'
import { Image, Popup, Menu, Button, Icon } from 'semantic-ui-react'

import styles from './TitleBar.module.scss'

const logoSrc = '/static/logo.svg'

export default function TitleBar(props) {
  const isSubmitRoute = RegExp('^/projects/new').test(props.route)
  const isProjectRoute =
    isSubmitRoute || props.route === '/' || RegExp('^/projects/').test(props.route)
  const remoteDomain = 'https://kitspace.org'
  return (
    <div className={styles.titleBar}>
      <div className={styles.bigSiteMenu}>
        <Menu inverted pointing secondary>
          <a href={remoteDomain + '/'}>
            <Image className={styles.logoImg} src={logoSrc} />
          </a>
          <SiteMenuItems
            remoteDomain={remoteDomain}
            route={props.route}
            isProjectRoute={isProjectRoute}
          />
        </Menu>
      </div>
      <div className={styles.bigSocialMenu}>
        <Menu inverted pointing secondary>
          {isSubmitRoute ? null : <AddAProjectButton remoteDomain={remoteDomain} />}
          <ContactMenu remoteDomain={remoteDomain} />
        </Menu>
      </div>
      <div className={styles.smallMenu}>
        <a href={remoteDomain + '/'}>
          <Image className={styles.logoImg} src={logoSrc} />
        </a>
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
            <SiteMenuItems
              remoteDomain={remoteDomain}
              route={props.route}
              isProjectRoute={isProjectRoute}
              remoteDomain={remoteDomain}
            />
            <SocialMenuItems remoteDomain={remoteDomain} />
            {isSubmitRoute ? null : (
              <AddAProjectButton remoteDomain={remoteDomain} />
            )}
          </Menu>
        </Popup>
      </div>
    </div>
  )
}

function AddAProjectButton(props) {
  const remoteDomain = props.remoteDomain || ''
  return (
    <Menu.Item>
      <Button
        icon
        labelPosition="left"
        color="green"
        href={remoteDomain + '/submit'}
      >
        <Icon name="plus" />
        Add a project
      </Button>
    </Menu.Item>
  )
}

function SiteMenuItems(props) {
  const remoteDomain = props.remoteDomain || ''
  return (
    <>
      <Menu.Item as="a" href={remoteDomain + '/'} active={props.isProjectRoute}>
        {'Projects'}
      </Menu.Item>
      <Menu.Item
        as="a"
        href={remoteDomain + '/bom-builder'}
        active={props.route === '/bom-builder/'}
      >
        {'BOM Builder'}
      </Menu.Item>
      <Menu.Item
        as="a"
        href={remoteDomain + '/1-click-bom'}
        active={props.route === '/1-click-bom/'}
      >
        {'1-click BOM'}
      </Menu.Item>
      <Menu.Item as="a" href="/" active={true}>
        {'Shop'}
      </Menu.Item>
    </>
  )
}

function SocialMenuItems(props) {
  const remoteDomain = props.remoteDomain || ''
  return (
    <>
      <Menu.Item as="a" href="https://riot.im/app/#/room/#kitspace:matrix.org">
        <Icon name="chat" />
        Chat
      </Menu.Item>
      <Menu.Item as="a" href={remoteDomain + '/newsletter/'}>
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
function ContactMenu({remoteDomain}) {
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
        <SocialMenuItems remoteDomain={remoteDomain} />
      </Menu>
    </Popup>
  )
}
