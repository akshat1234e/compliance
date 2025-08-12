import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { monitoringAPI } from '@/services/api'

interface MonitoringState {
  systemHealth: any
  alerts: any[]
  metrics: any[]
  healthChecks: any[]
  isLoading: boolean
  error: string | null
}

const initialState: MonitoringState = {
  systemHealth: null,
  alerts: [],
  metrics: [],
  healthChecks: [],
  isLoading: false,
  error: null,
}

export const fetchSystemHealth = createAsyncThunk(
  'monitoring/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await monitoringAPI.getSystemHealth()
      return health
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system health')
    }
  }
)

export const fetchAlerts = createAsyncThunk(
  'monitoring/fetchAlerts',
  async (resolved?: boolean, { rejectWithValue }) => {
    try {
      const alerts = await monitoringAPI.getAlerts(resolved)
      return alerts
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts')
    }
  }
)

export const resolveAlert = createAsyncThunk(
  'monitoring/resolveAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      await monitoringAPI.resolveAlert(alertId)
      return alertId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resolve alert')
    }
  }
)

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemHealth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSystemHealth.fulfilled, (state, action) => {
        state.isLoading = false
        state.systemHealth = action.payload
        state.error = null
      })
      .addCase(fetchSystemHealth.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        state.alerts = state.alerts.filter(alert => alert.id !== action.payload)
      })
  },
})

export const { clearError } = monitoringSlice.actions
export default monitoringSlice.reducer
