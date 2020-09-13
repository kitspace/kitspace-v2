import React, { createContext, useState } from 'react'

export const AuthContext = createContext({ isAuthenticated: false })

export default function AuthProvider(props) {
  const [auth, setAuth] = useState(false)

  const authorize = () => {
    setAuth(true)
  }

  const deAuthorize = () => {
    setAuth(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: auth, authorize, deAuthorize }}>
      {props.children}
    </AuthContext.Provider>
  )
}
