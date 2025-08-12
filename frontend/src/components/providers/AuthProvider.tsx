'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { getCurrentUser, setToken } from '@/store/slices/authSlice'

interface AuthContextType {
  isAuthenticated: boolean
  user: any
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, isLoading, error } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token')
    if (token && !user) {
      dispatch(setToken(token))
      dispatch(getCurrentUser())
    }
  }, [dispatch, user])

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
