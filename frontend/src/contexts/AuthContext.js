import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { node, string } from 'prop-types'

import { logout } from '@utils/giteaInternalApi'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  logout: async () => false,
  setUser: () => {},
  csrf: '',
})

const AuthProvider = ({ children, initialUser, initialCsrf }) => {
  const [user, setUser] = useState(initialUser)
  const [csrf, setCsrf] = useState(initialCsrf)

  const { push } = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.session = { user, csrf }
    }
  }, [user, csrf])

  const deAuthorize = async () => {
    setUser(null)
    push('/login')
    await logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        logout: deAuthorize,
        setUser,
        csrf,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: node.isRequired,
  initialUser: string.isRequired,
  initialCsrf: string.isRequired,
}

export default AuthProvider
