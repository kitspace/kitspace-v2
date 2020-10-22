import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext({ isAuthenticated: false })

export default function AuthProvider(props) {
  const [auth, setAuth] = useState(false)

  const authorize = () => {
    setAuth(true)
  }

  const deAuthorize = () => {
    setAuth(false)
  }

  useEffect(() => {
    const session = window?.session

    if (session?.user) {
      authorize()
    } else {
      deAuthorize()
    }
  })

  return (
    <AuthContext.Provider value={{ isAuthenticated: auth, authorize, deAuthorize }}>
      {props.children}
    </AuthContext.Provider>
  )
}
