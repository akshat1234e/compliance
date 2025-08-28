'use client'

import React, { createContext, useContext, useState } from 'react'

interface AuthContextType {
  user: any
  login: (credentials: any) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null)

  const login = async (credentials: any) => {
    // Mock login
    setUser({ id: '1', name: 'User', email: credentials.email })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}