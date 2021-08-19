import React, { createContext, useState, useEffect } from 'react'
import { node } from 'prop-types'

import { logout } from '@utils/giteaInternalApi'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  logout: async () => {},
  csrf: '',
})

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const [csrf, setCsrf] = useState('')

  useEffect(() => {
    setCsrf(window.session._csrf)
  }, [authenticatedUser, auth])

  const authorize = user => {
    setAuth(true)
    setAuthenticatedUser(user)
  }

  const deAuthorize = () => {
    setAuth(false)
    setAuthenticatedUser(null)
  }

  useEffect(() => {
    const session = window?.session

    if (session?.user) {
      authorize(session.user, session._csrf)
    } else {
      deAuthorize()
    }
  })

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: auth, user: authenticatedUser, logout, csrf }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: node.isRequired,
}

export default AuthProvider
