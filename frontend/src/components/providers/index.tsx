'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { store } from '@/store'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}
