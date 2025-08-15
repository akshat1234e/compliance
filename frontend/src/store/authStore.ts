import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      login: async (email: string, password: string) => {
        // Mock login - replace with actual API call
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin'
        }
        const mockToken = 'mock-jwt-token'
        
        set({
          user: mockUser,
          isAuthenticated: true,
          token: mockToken
        })
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null
        })
      },
      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)