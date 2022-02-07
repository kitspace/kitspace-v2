import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { node, string, object } from 'prop-types'

import { logout, getSession } from '@utils/giteaInternalApi'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  logout: async () => false,
  setUser: () => {},
  setCsrf: () => {},
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
    await logout()
    const { csrf } = await getSession()
    setCsrf(csrf)
    push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        logout: deAuthorize,
        setUser,
        setCsrf,
        csrf,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: node.isRequired,
  initialUser: object,
  initialCsrf: string.isRequired,
}

export default AuthProvider
