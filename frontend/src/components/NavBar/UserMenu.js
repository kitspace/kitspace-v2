import React, { useContext } from 'react'
import { Menu, Icon } from 'semantic-ui-react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import styles from './UserMenu.module.scss'
import { AuthContext } from '@contexts/AuthContext'

export const UserMenu = ({ userName }) => {
  const router = useRouter()
  const { csrf } = useContext(AuthContext)

  const signOut = async () => {
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
    <div>
      <div className={styles.userName}>{userName}</div>
      <Menu className={styles.menu} vertical attached>
        <Link prefetch href="/settings">
          <Menu.Item>
            <Icon name="settings" />
            Settings
          </Menu.Item>
        </Link>
        <Menu.Item onClick={signOut}>
          <Icon name="sign out" />
          Log out
        </Menu.Item>
      </Menu>
    </div>
  )
}
