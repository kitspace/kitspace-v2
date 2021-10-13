import React, { useContext, useState } from 'react'
import { Menu, Icon, Popup } from 'semantic-ui-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

import styles from './UserMenu.module.scss'
import { AuthContext } from '@contexts/AuthContext'

export const UserMenuButton = () => {
  const { user } = useContext(AuthContext)
  const [open, setOpen] = useState(false)

  return (
    <Menu.Item data-cy="user-menu">
      <Popup
        trigger={
          <a>
            <div className={styles.userDropContainer}>
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
        <UserMenu userName={user.username} />
      </Popup>
    </Menu.Item>
  )
}

const UserMenu = ({ userName }) => {
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
