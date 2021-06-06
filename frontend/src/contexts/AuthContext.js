import React, { createContext, useState, useEffect } from 'react'
import { node } from 'prop-types'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  csrf: '',
})

const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [csrf, setCsrf] = useState('')

  useEffect(() => {
    setCsrf(window.session._csrf)
  }, [user, auth])

  // eslint-disable-next-line no-shadow
  const authorize = user => {
    setAuth(true)
    setUser(user)
  }

  const deAuthorize = () => {
    setAuth(false)
    setUser(null)
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
    <AuthContext.Provider value={{ isAuthenticated: auth, user, csrf }}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: node.isRequired,
}

export default AuthProvider
