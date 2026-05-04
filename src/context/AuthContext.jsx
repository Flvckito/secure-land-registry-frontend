import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Token lives in memory — not state directly (avoids re-render on every read).
  // We do keep `user` in state so the UI reacts to login/logout.
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true = checking existing session

  // On mount, try to restore session from sessionStorage token
  useEffect(() => {
    const restore = async () => {
      const token = sessionStorage.getItem('lr_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const profile = await authService.getProfile()
        setUser(profile)
      } catch {
        // Token invalid/expired — clear it
        sessionStorage.removeItem('lr_token')
      } finally {
        setLoading(false)
      }
    }
    restore()
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user: userData } = await authService.login(email, password)
    sessionStorage.setItem('lr_token', token)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    sessionStorage.removeItem('lr_token')
    setUser(null)
  }, [])

  // Role helpers
  const hasRole = useCallback(
    (...roles) => roles.includes(user?.role),
    [user]
  )

  const isAdmin = useCallback(() => user?.role === 'admin', [user])
  const isOfficer = useCallback(
    () => ['admin', 'land_officer'].includes(user?.role),
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isOfficer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}