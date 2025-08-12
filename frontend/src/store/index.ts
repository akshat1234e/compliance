import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authSlice from './slices/authSlice'
import dashboardSlice from './slices/dashboardSlice'
import connectorsSlice from './slices/connectorsSlice'
import webhooksSlice from './slices/webhooksSlice'
import monitoringSlice from './slices/monitoringSlice'
import complianceSlice from './slices/complianceSlice'
import workflowSlice from './slices/workflowSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    dashboard: dashboardSlice,
    connectors: connectorsSlice,
    webhooks: webhooksSlice,
    monitoring: monitoringSlice,
    compliance: complianceSlice,
    workflow: workflowSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
