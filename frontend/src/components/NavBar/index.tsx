import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBluesky,
  faDiscord,
  faMastodon,
} from '@fortawesome/free-brands-svg-icons'

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
        <a>
          Adding a project
          <span style={{ marginLeft: 10 }}>
          <Icon name="external alternate" />
          </span>
        </a>
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
    <Menu.Item as="a" href="https://app.element.io/#/room/#kitspace:matrix.org">
      Element/Matrix Chat
      <Icon name="chat" />
    </Menu.Item>
    <Menu.Item as="a" href="http://discord.gg/nFjDCZqghC">
      Discord Chat
      <Icon>
        <FontAwesomeIcon icon={faDiscord} />
      </Icon>
    </Menu.Item>
    <Link passHref href="/newsletter">
      <Menu.Item as="a">
        Email & Newsletter
        <Icon name="envelope" />
      </Menu.Item>
    </Link>
    <Menu.Item as="a" href="https://bsky.app/profile/kitspace.org">
      Bluesky
      <Icon>
        <FontAwesomeIcon icon={faBluesky} />
      </Icon>
    </Menu.Item>
    <Menu.Item as="a" href="https://mastodon.social/@kitspace">
      Mastodon
      <Icon>
        <FontAwesomeIcon icon={faMastodon} />
      </Icon>
    </Menu.Item>
    <Menu.Item as="a" href="https://github.com/kitspace">
      GitHub
      <Icon name="github" />
    </Menu.Item>
    <Menu.Item as="a" href="https://opencollective.com/kitspace">
      Donate
      <Icon name="heart" />
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
        <Button basic inverted icon labelPosition="right">
          <Icon name="angle down" />
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
