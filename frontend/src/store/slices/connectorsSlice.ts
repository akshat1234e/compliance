import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { gatewayAPI } from '@/services/api'

interface ConnectorsState {
  connectors: any[]
  status: any
  metrics: any[]
  isLoading: boolean
  error: string | null
}

const initialState: ConnectorsState = {
  connectors: [],
  status: null,
  metrics: [],
  isLoading: false,
  error: null,
}

export const fetchConnectorStatus = createAsyncThunk(
  'connectors/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const status = await gatewayAPI.getConnectorStatus()
      return status
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch connector status')
    }
  }
)

export const fetchConnectorMetrics = createAsyncThunk(
  'connectors/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const metrics = await gatewayAPI.getConnectorMetrics()
      return metrics
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch connector metrics')
    }
  }
)

const connectorsSlice = createSlice({
  name: 'connectors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnectorStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchConnectorStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.status = action.payload
        state.error = null
      })
      .addCase(fetchConnectorStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchConnectorMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload
      })
  },
})

export const { clearError } = connectorsSlice.actions
export default connectorsSlice.reducer
