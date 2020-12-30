import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  csrf: '',
})

export default function AuthProvider(props) {
  const [auth, setAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [csrf, setCsrf] = useState('')

  useEffect(() => {
    const csrf = window.session._csrf
    setCsrf(csrf)
  }, [user, auth])

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
      {props.children}
    </AuthContext.Provider>
  )
}
