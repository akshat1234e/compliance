import { create } from 'zustand'

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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  isAuthenticated: true,
  token: 'mock-token',
  login: async (email: string, password: string) => {
    const mockUser = { id: '1', name: 'Admin User', email, role: 'admin' }
    set({ user: mockUser, isAuthenticated: true, token: 'mock-token' })
  },
  logout: () => set({ user: null, isAuthenticated: false, token: null })
}))