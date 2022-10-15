import React, { useContext, useState } from 'react'
import { Menu, Icon, Popup } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

import styles from './UserMenu.module.scss'
import { AuthContext } from '@contexts/AuthContext'

export const UserDropDownMenu = () => {
  const { user } = useContext(AuthContext)
  const [isOpen, setIsOpen] = useState(false)

  const href = `/${user.username}`
  return (
    <Menu.Item className={styles.userMenuIcon} data-cy="user-menu">
      <Popup
        className={styles.userDropDownMenuPopup}
        on="click"
        position="bottom right"
        trigger={
          <a className={styles.userDropDownMenuContainer}>
            <Image
              alt="avatar"
              className={styles.userImage}
              height={35}
              objectFit="scale-down"
              src={user.avatar_url}
              width={35}
            />
            <Icon name={`triangle ${isOpen ? 'up' : 'down'}`} />
          </a>
        }
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
      >
        <Link passHref href={href}>
          <div className={styles.userName}>
            <a href={href}>{user.username}</a>
          </div>
        </Link>
        <Menu attached vertical className={styles.menu}>
          <UserMenuItems />
        </Menu>
      </Popup>
    </Menu.Item>
  )
}

export const UserMenuItems = () => {
  return (
    <>
      <Link passHref href="/settings">
        <Menu.Item id="settings">
          <Icon name="settings" />
          Settings
        </Menu.Item>
      </Link>
      <LogoutButton />
    </>
  )
}

const LogoutButton = () => {
  const { push } = useRouter()
  const { logout } = useContext(AuthContext)

  const onClick = async () => {
    const loggedOut = await logout()

    if (loggedOut) {
      push('/login')
    }
  }

  return (
    <Menu.Item id="logout" onClick={onClick}>
      <Icon name="sign out" />
      Log out
    </Menu.Item>
  )
}
