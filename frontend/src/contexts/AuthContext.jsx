import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { node, object } from 'prop-types'

import { logout, getSession } from '@utils/giteaInternalApi'

export const AuthContext = createContext({
  apiToken: null,
  csrf: '',
  isAuthenticated: false,
  logout: async () => false,
  setApiToken: () => {},
  setCsrf: () => {},
  setUser: () => {},
  user: null,
})

export const AuthProvider = ({ children, initialSession }) => {
  const [apiToken, setApiToken] = useState(initialSession.ApiToken)
  const [user, setUser] = useState(initialSession.user)
  const [csrf, setCsrf] = useState(initialSession.csrf)

  const { push } = useRouter()

  useEffect(() => {
    sessionStorage.setItem('session', JSON.stringify({ user, csrf, apiToken }))
  }, [user, csrf, apiToken])

  const deAuthorize = async () => {
    setUser(null)
    setApiToken(null)
    await logout()
    const { csrf } = await getSession()
    setCsrf(csrf)
    push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        apiToken,
        csrf,
        logout: deAuthorize,
        setApiToken,
        setCsrf,
        setUser,
        user,
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
