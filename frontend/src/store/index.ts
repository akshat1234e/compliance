import { configureStore } from '@reduxjs/toolkit'

// Create a minimal store for now
export const store = configureStore({
  reducer: {
    // Add reducers here as needed
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export hooks for components
export const useAppDispatch = () => store.dispatch
export const useAppSelector = (selector: (state: RootState) => any) => selector(store.getState())