import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { node, object } from 'prop-types'

import { logout, getSession } from '@utils/giteaInternalApi'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  logout: async () => false,
  setUser: () => {},
  setCsrf: () => {},
  csrf: '',
})

const AuthProvider = ({ children, initialSession }) => {
  const [user, setUser] = useState(initialSession.user)
  const [csrf, setCsrf] = useState(initialSession.csrf)

  const { push } = useRouter()

  useEffect(() => {
    sessionStorage.setItem(
      'session',
      JSON.stringify({ ...initialSession, user, csrf }),
    )
  }, [user, csrf, initialSession])

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
  initialSession: object,
}

export default AuthProvider
