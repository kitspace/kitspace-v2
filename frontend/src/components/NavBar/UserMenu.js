import React, { useContext, useState } from 'react'
import { Menu, Icon, Popup } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

import styles from './UserMenu.module.scss'
import { AuthContext } from '@contexts/AuthContext'

export const UserDropDownMenu = () => {
  const { user } = useContext(AuthContext)
  const [open, setOpen] = useState(false)

  const href = `/${user.username}`
  return (
    <Menu.Item data-cy="user-menu">
      <Popup
        trigger={
          <a>
            <div className={styles.userDropDownMenuContainer}>
              <Image alt="avatar" width={20} height={20} src={user.avatar_url} />
              <Icon name={`triangle ${open ? 'up' : 'down'}`} />
            </div>
          </a>
        }
        position="bottom right"
        on="click"
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
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
