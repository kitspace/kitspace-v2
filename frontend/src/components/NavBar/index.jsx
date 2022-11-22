import React, { useContext } from 'react'
import { bool } from 'prop-types'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'

import { AuthContext } from '@contexts/AuthContext'
import SearchBar from './SearchBar'
import { UserMenuItems, UserDropDownMenu } from './UserMenu'
import styles from './index.module.scss'

const NavBar = () => {
  return (
    <div className={styles.titleBar} id="nav">
      <BigBar />
      <SmallBar />
    </div>
  )
}

const Logo = () => {
  return (
    <Link href="/">
      <a>
        {/* using next/image here causes it to blink on page transitions in firefox */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="logo" className={styles.logoImg} src="/static/logo.svg" />
      </a>
    </Link>
  )
}

const BigBar = () => (
  /* This is the Navbar rendered on big screens */
  <>
    <div className={styles.bigSiteMenu}>
      <Menu inverted pointing secondary>
        <Logo />
        <SiteMenuItems />
      </Menu>
    </div>
    <div className={styles.bigSocialMenu}>
      <Menu inverted pointing secondary>
        <AddProjectButton />
        <ContactMenu />
        <UserControllerButton />
      </Menu>
    </div>
  </>
)

const SmallBar = () => (
  /* This is the Navbar render on small screens */
  <div className={styles.smallNavBar}>
    <Logo />
    <Popup
      basic
      inverted
      on="click"
      position="bottom right"
      trigger={
        <Button basic icon inverted size="large">
          <Icon inverted name="bars" />
        </Button>
      }
    >
      <Menu inverted vertical className={styles.smallMenu}>
        <UserControllerButton smallNavBar />
        <AddProjectButton />
        <SiteMenuItems />
        <SocialMenuItems />
      </Menu>
    </Popup>
  </div>
)

const AddProjectButton = () => {
  return (
    <Menu.Item className={styles.addProject} data-cy="add-project">
      <Link passHref href="/projects/new">
        <Button icon as="a" color="green" id="add_project" labelPosition="left">
          <Icon name="plus" />
          Add a project
        </Button>
      </Link>
    </Menu.Item>
  )
}

const SiteMenuItems = () => {
  const { pathname } = useRouter()
  const isProjectRoute =
    pathname === '/' ||
    pathname === '/search' ||
    RegExp('^/projects/').test(pathname)

  return (
    <>
      <Link passHref href="/">
        <Menu.Item
          active={isProjectRoute}
          as="a"
          // Add a separation line after user specific actions.
          className={styles.projects}
          href="/"
        >
          Projects
        </Menu.Item>
      </Link>
      <Link passHref href="/bom-builder">
        <Menu.Item active={pathname === '/bom-builder'} as="a">
          BOM Builder
        </Menu.Item>
      </Link>
      <Link passHref href="/1-click-bom">
        <Menu.Item active={pathname === '/1-click-bom'} as="a">
          1-click BOM
        </Menu.Item>
      </Link>
      <Menu.Item className={styles.SearchBarContainer}>
        <SearchBar />
      </Menu.Item>
    </>
  )
}

const SocialMenuItems = () => (
  <>
    <Menu.Item as="a" href="https://riot.im/app/#/room/#kitspace:matrix.org">
      <Icon name="chat" />
      Chat
    </Menu.Item>
    <Link passHref href="/newsletter">
      <Menu.Item as="a">
        <Icon name="envelope" />
        Email & Newsletter
      </Menu.Item>
    </Link>
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

const ContactMenu = () => (
  <Popup
    color="blue"
    on="click"
    position="bottom right"
    trigger={
      <Menu.Item className="contact-button">
        <Button icon color="blue" labelPosition="right">
          <Icon inverted name="comments" />
          {/* force the loading of brand-icons before the menu is visible */}
          <Icon className={styles.icon} name="twitter" />
          Make contact
        </Button>
      </Menu.Item>
    }
  >
    <Menu secondary vertical>
      <SocialMenuItems />
    </Menu>
  </Popup>
)

/**
 * Log in button if the user is unauthenticated, user menu otherwise.
 */
const UserControllerButton = ({ smallNavBar }) => {
  const { user } = useContext(AuthContext)

  if (user != null) {
    if (smallNavBar) {
      return <UserMenuItems />
    }

    return <UserDropDownMenu />
  }

  return <LogInButton />
}

const LogInButton = () => {
  const { asPath } = useRouter()

  const href = { pathname: '/login' }
  if (!asPath.startsWith('/login')) {
    href.query = { redirect: asPath }
  }

  return (
    <Menu.Item className={styles.LogInButton}>
      <Link passHref href={href}>
        <Button as="a" color="green" id="login">
          Login
        </Button>
      </Link>
    </Menu.Item>
  )
}

UserControllerButton.propTypes = {
  smallNavBar: bool,
}

export default NavBar
