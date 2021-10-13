import React, { forwardRef, useContext } from 'react'
import { bool } from 'prop-types'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'
import _JSXStyle from 'styled-jsx/style'

import { AuthContext } from '@contexts/AuthContext'
import SearchBar from './SearchBar'
import { UserMenuButton } from './UserMenu'
import styles from './index.module.scss'

const NavBar = () => {
  const { pathname } = useRouter()

  const isSubmitRoute = RegExp('^/projects/new').test(pathname)
  const isProjectRoute =
    isSubmitRoute || pathname === '/' || RegExp('^/projects/').test(pathname)

  return (
    <div className={styles.titleBar} id="nav">
      <BigBar isProjectRoute={isProjectRoute} isSubmitRoute={isSubmitRoute} />
      <SmallBar isProjectRoute={isProjectRoute} isSubmitRoute={isSubmitRoute} />
    </div>
  )
}

const Logo = forwardRef(function LogoWithRef({ onClick, href }, ref) {
  /*
   TODO: FIXME when there's a better way(w/o forwardRef) to wrap a functional component with `Link`.
   * Wrapping the `Image` directly with `Link` causes a runtime error:
    ```
    ! Warning: Function components cannot be given refs.
    ```
   * To get around this the image is wrapped in `a` tag with `forwardRef`.
  */
  return (
    <a style={{ display: 'flex' }} href={href} onClick={onClick} ref={ref}>
      <Image
        width={160}
        height={46}
        objectFit="scale-down"
        className={styles.logoImg}
        src="/static/logo.svg"
        alt="logo"
      />
    </a>
  )
})

const BigBar = ({ isProjectRoute, isSubmitRoute }) => (
  /* This is the Navbar rendered on big screens */
  <>
    <div className={styles.bigSiteMenu}>
      <Menu inverted pointing secondary>
        <Link href="/" passHref>
          <Logo />
        </Link>
        <SiteMenuItems isProjectRoute={isProjectRoute} />
      </Menu>
    </div>
    <div className={styles.bigSocialMenu}>
      <Menu inverted pointing secondary>
        {isSubmitRoute ? null : <AddProjectButton />}
        <ContactMenu />
        <UserControllerButton />
      </Menu>
    </div>
  </>
)

const SmallBar = ({ isProjectRoute, isSubmitRoute }) => (
  /* This is the Navbar render on small screens */
  <div className={styles.smallMenu}>
    <Link href="/" passHref>
      <Logo />
    </Link>
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
        {isSubmitRoute ? null : <AddProjectButton />}
        <SiteMenuItems isProjectRoute={isProjectRoute} />
        <SocialMenuItems />
        <UserControllerButton />
      </Menu>
    </Popup>
  </div>
)

const AddProjectButton = () => {
  const { push, pathname } = useRouter()

  const onClick = async e => {
    e.preventDefault()
    await push('/projects/new')
  }

  return pathname !== '/login' ? (
    <>
      <Menu.Item>
        <Button
          id="add_project"
          icon
          labelPosition="left"
          color="green"
          onClick={onClick}
        >
          <Icon name="plus" />
          Add a project
        </Button>
      </Menu.Item>
    </>
  ) : null
}

const SiteMenuItems = ({ isProjectRoute }) => {
  const { pathname } = useRouter()

  return (
    <>
      <Menu.Item as="a" href="/" active={isProjectRoute}>
        Projects
      </Menu.Item>
      <Menu.Item as="a" href="/bom-builder" active={pathname === '/bom-builder/'}>
        BOM Builder
      </Menu.Item>
      <Menu.Item as="a" href="/1-click-bom" active={pathname === '/1-click-bom/'}>
        1-click BOM
      </Menu.Item>
      <Menu.Item className={styles.SearchBarContainer}>
        <SearchBar />
      </Menu.Item>
      {/* Align menu items with the search bar vertically. */}
      <style jsx global>{`
        #nav div .menu :is(a, div).item {
          align-self: center;
        }
      `}</style>
    </>
  )
}

const SocialMenuItems = () => (
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

const ContactMenu = () => (
  <Popup
    trigger={
      <Menu.Item className="contact-button">
        <Button labelPosition="right" icon color="blue">
          <Icon inverted name="comments" />
          {/* force the loading of brand-icons before the menu is visible */}
          <Icon className={styles.icon} name="twitter" />
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

/**
 * Log in button if the user is unauthenticated, user menu if otherwise.
 */
const UserControllerButton = () => {
  const { pathname } = useRouter()

  const { isAuthenticated } = useContext(AuthContext)
  const isLogInRoute = pathname === '/login'

  if (isAuthenticated) {
    return <UserMenuButton />
  }

  if (isLogInRoute) {
    return null
  }

  return <LogInButton />
}

const LogInButton = () => {
  const { asPath, push } = useRouter()

  const onClick = async () => {
    await push(`/login?redirect=${asPath}`)
  }

  return (
    <Menu.Item>
      <Button id="login" color="green" onClick={onClick}>
        Login
      </Button>
    </Menu.Item>
  )
}

BigBar.propTypes = {
  isProjectRoute: bool.isRequired,
  isSubmitRoute: bool.isRequired,
}

SmallBar.propTypes = {
  isProjectRoute: bool.isRequired,
  isSubmitRoute: bool.isRequired,
}

SiteMenuItems.propTypes = {
  isProjectRoute: bool.isRequired,
}

export default NavBar
