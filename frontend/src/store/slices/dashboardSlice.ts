import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { monitoringAPI } from '@/services/api'

interface DashboardState {
  systemHealth: any
  connectorMetrics: any[]
  alerts: any[]
  performanceMetrics: any
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: DashboardState = {
  systemHealth: null,
  connectorMetrics: [],
  alerts: [],
  performanceMetrics: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [systemHealth, connectorMetrics, alerts, performanceMetrics] = await Promise.all([
        monitoringAPI.getSystemHealth(),
        monitoringAPI.getConnectorMetrics(),
        monitoringAPI.getAlerts(false), // Only unresolved alerts
        monitoringAPI.getPerformanceMetrics(),
      ])

      return {
        systemHealth,
        connectorMetrics,
        alerts,
        performanceMetrics,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data')
    }
  }
)

export const refreshSystemHealth = createAsyncThunk(
  'dashboard/refreshSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const systemHealth = await monitoringAPI.getSystemHealth()
      return systemHealth
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to refresh system health')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateConnectorMetric: (state, action: PayloadAction<any>) => {
      const index = state.connectorMetrics.findIndex(
        (metric) => metric.connectorId === action.payload.connectorId
      )
      if (index !== -1) {
        state.connectorMetrics[index] = action.payload
      } else {
        state.connectorMetrics.push(action.payload)
      }
    },
    addAlert: (state, action: PayloadAction<any>) => {
      state.alerts.unshift(action.payload)
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false
        state.systemHealth = action.payload.systemHealth
        state.connectorMetrics = action.payload.connectorMetrics
        state.alerts = action.payload.alerts
        state.performanceMetrics = action.payload.performanceMetrics
        state.lastUpdated = new Date().toISOString()
        state.error = null
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Refresh system health
      .addCase(refreshSystemHealth.fulfilled, (state, action) => {
        state.systemHealth = action.payload
        state.lastUpdated = new Date().toISOString()
      })
  },
})

export const { clearError, updateConnectorMetric, addAlert, removeAlert } = dashboardSlice.actions
export default dashboardSlice.reducer
