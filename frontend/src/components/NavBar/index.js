import React, { forwardRef, useContext } from 'react'
import { bool } from 'prop-types'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'
import _JSXStyle from 'styled-jsx/style'

import { AuthContext } from '@contexts/AuthContext'
import SearchBar from './SearchBar'
import { UserMenuItems, UserDropDownMenu } from './UserMenu'
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
    <a ref={ref} href={href} style={{ display: 'flex' }} onClick={onClick}>
      <Image
        alt="logo"
        className={styles.logoImg}
        height={46}
        objectFit="scale-down"
        src="/static/logo.svg"
        width={160}
      />
    </a>
  )
})

const BigBar = ({ isProjectRoute, isSubmitRoute }) => (
  /* This is the Navbar rendered on big screens */
  <>
    <div className={styles.bigSiteMenu}>
      <Menu inverted pointing secondary>
        <Link passHref href="/">
          <Logo />
        </Link>
        <SiteMenuItems isProjectRoute={isProjectRoute} />
      </Menu>
    </div>
    <div className={styles.bigSocialMenu}>
      <Menu inverted pointing secondary>
        {!isSubmitRoute ? <AddProjectButton /> : null}
        <ContactMenu />
        <UserControllerButton />
      </Menu>
    </div>
  </>
)

const SmallBar = ({ isProjectRoute, isSubmitRoute }) => (
  /* This is the Navbar render on small screens */
  <div className={styles.smallMenu}>
    <Link passHref href="/">
      <Logo />
    </Link>
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
      <Menu inverted vertical id="small-menu">
        <UserControllerButton smallNavBar />
        {!isSubmitRoute ? <AddProjectButton /> : null}
        <SiteMenuItems isProjectRoute={isProjectRoute} />
        <SocialMenuItems />
      </Menu>
      {
        /* Add a separation line after user specific actions.*/
        <style global jsx>{`
          #small-menu #projects:before {
            background-color: white;
            height: 1px;
            margin-bottom: 30px;
          }
        `}</style>
      }
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
      <Menu.Item id="add-project">
        <Button
          icon
          color="green"
          id="add_project"
          labelPosition="left"
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
      <Menu.Item active={isProjectRoute} as="a" href="/" id="projects">
        Projects
      </Menu.Item>
      <Menu.Item active={pathname === '/bom-builder'} as="a" href="/bom-builder">
        BOM Builder
      </Menu.Item>
      <Menu.Item active={pathname === '/1-click-bom'} as="a" href="/1-click-bom">
        1-click BOM
      </Menu.Item>
      <Menu.Item className={styles.SearchBarContainer}>
        <SearchBar />
      </Menu.Item>
      {/* Align menu items with the search bar vertically. */}
      <style global jsx>{`
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
  const { pathname } = useRouter()

  const { isAuthenticated } = useContext(AuthContext)
  const isLogInRoute = pathname === '/login'

  if (isAuthenticated) {
    if (smallNavBar) {
      return <UserMenuItems />
    }

    return <UserDropDownMenu />
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
      <Button color="green" id="login" onClick={onClick}>
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
