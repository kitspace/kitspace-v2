import React, { useContext } from 'react'
import { Button, Icon, Image, Menu, Popup } from 'semantic-ui-react'
import { useRouter } from 'next/router'

import { AuthContext } from '../contexts/AuthContext'
import styles from './TitleBar.module.scss'

const logoSrc = '/static/logo.svg'

export const NavBar = () => {
  const { pathname } = useRouter()

  const isSubmitRoute = RegExp('^/projects/new').test(pathname)
  const isProjectRoute =
    isSubmitRoute || pathname === '/' || RegExp('^/projects/').test(pathname)

  return (
    <div className={styles.titleBar}>
      <BigBar isProjectRoute={isProjectRoute} isSubmitRoute={isSubmitRoute} />
      <SmallBar isProjectRoute={isProjectRoute} isSubmitRoute={isSubmitRoute} />
    </div>
  )
}

function BigBar({ isProjectRoute, isSubmitRoute }) {
  /* This is the Navbar render on big screens */
  return (
    <>
      <div className={styles.bigSiteMenu}>
        <Menu inverted pointing secondary>
          <a href="/">
            <Image className={styles.logoImg} src={logoSrc} />
          </a>
          <SiteMenuItems isProjectRoute={isProjectRoute} />
        </Menu>
      </div>
      <div className={styles.bigSocialMenu}>
        <Menu inverted pointing secondary>
          {isSubmitRoute ? null : <AddProjectButton />}
          <ContactMenu />
          <SigningButton />
        </Menu>
      </div>
    </>
  )
}

function SmallBar({ isProjectRoute, isSubmitRoute }) {
  /* This is the Navbar render on small screens */

  return (
    <>
      <div className={styles.smallMenu}>
        <a href="/">
          <Image className="logoImg" src={logoSrc} />
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
            {isSubmitRoute ? null : <AddProjectButton />}
            <SiteMenuItems isProjectRoute={isProjectRoute} />
            <SocialMenuItems />
            <SigningButton />
          </Menu>
        </Popup>
      </div>
    </>
  )
}

function AddProjectButton() {
  const { isAuthenticated } = useContext(AuthContext)
  const { push, pathname } = useRouter()

  const onClick = event => {
    event.preventDefault()

    if (isAuthenticated) {
      push('/projects/new')
    } else {
      push('/login')
    }
  }

  return pathname !== '/login' ? (
    <>
      <Menu.Item>
        <Button icon labelPosition="left" color="green" onClick={onClick}>
          <Icon name="plus" />
          Add a project
        </Button>
      </Menu.Item>
    </>
  ) : null
}

function SiteMenuItems({ isProjectRoute }) {
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
            {/* force the loading of brand-icons before the menu is visible */}
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

function SigningButton() {
  const { pathname } = useRouter()

  const { isAuthenticated } = useContext(AuthContext)
  const isLoginRoute = pathname === '/login'

  return isAuthenticated ? <LogoutButton /> : isLoginRoute ? null : <LoginButton />
}

function LoginButton() {
  return (
    <Menu.Item>
      <Button color="green" href="/login">
        Log in
      </Button>
    </Menu.Item>
  )
}

function LogoutButton() {
  const router = useRouter()

  const onClick = async () => {
    const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/logout`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `_csrf=${window.session._csrf}`,
      credentials: 'include',
    })

    if (response.ok) {
      router.pathname === '/' ? router.reload() : await router.push('/')
    }
  }
  return (
    <Menu.Item>
      <Button color="red" onClick={onClick}>
        Log out
      </Button>
    </Menu.Item>
  )
}

export default NavBar
