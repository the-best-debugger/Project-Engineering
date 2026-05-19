import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }
  }, [])

  const login = (userData, sessionToken) => {
    setUser(userData)
    setToken(sessionToken)
    localStorage.setItem(AUTH_TOKEN_KEY, sessionToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
