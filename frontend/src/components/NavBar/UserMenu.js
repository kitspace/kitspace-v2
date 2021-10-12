import React, { useContext } from 'react'
import { Menu, Icon } from 'semantic-ui-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './UserMenu.module.scss'
import { AuthContext } from '@contexts/AuthContext'

export const UserMenu = ({ userName }) => {
  return (
    <div>
      <div className={styles.userName}>{userName}</div>
      <Menu className={styles.menu} vertical attached>
        <Link href="/settings" passHref>
          <Menu.Item>
            <Icon name="settings" />
            Settings
          </Menu.Item>
        </Link>
        <LogoutButton />
      </Menu>
    </div>
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
    <Menu.Item onClick={onClick}>
      <Icon name="sign out" />
      Log out
    </Menu.Item>
  )
}
