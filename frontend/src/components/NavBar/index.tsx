import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'

import NavSearchInput from './NavSearchInput'
import styles from './index.module.scss'
import logoSvg from './logo.svg'
import { useSearchQuery } from '@contexts/SearchContext'

const NavBar = () => {
  return (
    <nav className={styles.titleBar}>
      <BigBar />
      <SmallBar />
    </nav>
  )
}

const Logo = () => {
  return (
    <Link href="/">
      <a>
        {/* using next/image here causes it to blink on page transitions in firefox */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="logo" className={styles.logoImg} src={logoSvg.src} />
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
        <AddProjectButton />
        <SiteMenuItems />
        <SocialMenuItems />
      </Menu>
    </Popup>
  </div>
)

const AddProjectButton = () => {
  return (
    <Menu.Item data-cy="add-project">
      <Link
        passHref
        href="https://github.com/kitspace/kitspace-v2#adding-your-project"
      >
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
  const isSearchRoute = pathname === '/' || pathname === '/search'
  const isProjectRoute = isSearchRoute

  const { query } = useSearchQuery()
  return (
    <>
      <Link passHref href={query ? `/search?q=${encodeURIComponent(query)}` : '/'}>
        <Menu.Item active={isProjectRoute} as="a" className={styles.projects}>
          Projects
        </Menu.Item>
      </Link>
      <Link passHref href="/1-click-bom">
        <Menu.Item active={pathname === '/1-click-bom'} as="a">
          1-click BOM
        </Menu.Item>
      </Link>
      {isSearchRoute ? null : (
        <Menu.Item className={styles.SearchBarContainer}>
          <NavSearchInput />
        </Menu.Item>
      )}
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

export default NavBar
