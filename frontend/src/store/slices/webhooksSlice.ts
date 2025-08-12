import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { webhookAPI } from '@/services/api'

interface WebhooksState {
  endpoints: any[]
  deliveries: any[]
  stats: any
  isLoading: boolean
  error: string | null
}

const initialState: WebhooksState = {
  endpoints: [],
  deliveries: [],
  stats: null,
  isLoading: false,
  error: null,
}

export const fetchWebhookEndpoints = createAsyncThunk(
  'webhooks/fetchEndpoints',
  async (_, { rejectWithValue }) => {
    try {
      const endpoints = await webhookAPI.getEndpoints()
      return endpoints
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch webhook endpoints')
    }
  }
)

export const createWebhookEndpoint = createAsyncThunk(
  'webhooks/createEndpoint',
  async (endpoint: any, { rejectWithValue }) => {
    try {
      const newEndpoint = await webhookAPI.createEndpoint(endpoint)
      return newEndpoint
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create webhook endpoint')
    }
  }
)

export const fetchWebhookStats = createAsyncThunk(
  'webhooks/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await webhookAPI.getStats()
      return stats
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch webhook stats')
    }
  }
)

const webhooksSlice = createSlice({
  name: 'webhooks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWebhookEndpoints.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWebhookEndpoints.fulfilled, (state, action) => {
        state.isLoading = false
        state.endpoints = action.payload
        state.error = null
      })
      .addCase(fetchWebhookEndpoints.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(createWebhookEndpoint.fulfilled, (state, action) => {
        state.endpoints.push(action.payload)
      })
      .addCase(fetchWebhookStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { clearError } = webhooksSlice.actions
export default webhooksSlice.reducer
