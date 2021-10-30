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
    <Menu.Item data-cy="user-menu" className={styles.userMenuIcon}>
      <Popup
        className={styles.userDropDownMenuPopup}
        trigger={
          <a className={styles.userDropDownMenuContainer}>
            <Image
              className={styles.userImage}
              alt="avatar"
              width={35}
              height={35}
              src={user.avatar_url}
              objectFit="scale-down"
            />
            <Icon name={`triangle ${isOpen ? 'up' : 'down'}`} />
          </a>
        }
        position="bottom right"
        on="click"
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
      >
        <Link href={href} passHref>
          <div className={styles.userName}>
            <a href={href}>{user.username}</a>
          </div>
        </Link>
        <Menu className={styles.menu} vertical attached>
          <UserMenuItems />
        </Menu>
      </Popup>
    </Menu.Item>
  )
}

export const UserMenuItems = () => {
  return (
    <>
      <Link href="/settings" passHref>
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
  const { push, reload } = useRouter()
  const { logout } = useContext(AuthContext)

  const onClick = async () => {
    const loggedOut = await logout()

    if (loggedOut) {
      await push('/login')
      reload()
    }
  }

  return (
    <Menu.Item onClick={onClick} id="logout">
      <Icon name="sign out" />
      Log out
    </Menu.Item>
  )
}
