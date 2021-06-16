import React, { useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Button, Icon, Menu, Popup } from 'semantic-ui-react'

import { AuthContext } from '@contexts/AuthContext'
import { bool } from 'prop-types'
import styles from './NavBar.module.scss'

const logoSrc = '/static/logo.svg'

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

function BigBar({ isProjectRoute, isSubmitRoute }) {
  /* This is the Navbar rendered on big screens */
  return (
    <>
      <div className={styles.bigSiteMenu}>
        <Menu inverted pointing secondary>
          <Link href="/" passHref >
            <Image width={160} height={46} objectFit='scale-down' className={styles.logoImg} src={logoSrc} alt="logo" />
          </Link>
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
        <Link href="/" passHref>
          <Image width={140} height={46} objectFit='scale-down' className="logoImg" src={logoSrc} alt="logo" />
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
            <SigningButton />
          </Menu>
        </Popup>
      </div>
    </>
  )
}

function AddProjectButton() {
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

  if (isAuthenticated) {
    return <LogoutButton />
  }

  if (isLoginRoute) {
    return null
  }

  return <LoginButton />
}

function LoginButton() {
  const { asPath, push } = useRouter()

  const onClick = async () => {
    await push(`/login?redirect=${asPath}`)
  }

  return (
    <Menu.Item>
      <Button id="login" color="green" onClick={onClick}>
        Log in
      </Button>
    </Menu.Item>
  )
}

function LogoutButton() {
  const router = useRouter()
  const { csrf } = useContext(AuthContext)

  const onClick = async () => {
    const endpoint = `${process.env.KITSPACE_GITEA_URL}/user/logout`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `_csrf=${csrf}`,
      credentials: 'include',
    })

    if (response.ok) {
      await router.push('/login')
      router.reload()
    }
  }
  return (
    <Menu.Item>
      <Button id="logout" color="red" onClick={onClick}>
        Log out
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
