import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { complianceAPI } from '@/services/api'

interface ComplianceState {
  workflows: any[]
  tasks: any[]
  reports: any[]
  isLoading: boolean
  error: string | null
}

const initialState: ComplianceState = {
  workflows: [],
  tasks: [],
  reports: [],
  isLoading: false,
  error: null,
}

export const fetchWorkflows = createAsyncThunk(
  'compliance/fetchWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      const workflows = await complianceAPI.getWorkflows()
      return workflows
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workflows')
    }
  }
)

export const fetchTasks = createAsyncThunk(
  'compliance/fetchTasks',
  async (params?: any, { rejectWithValue }) => {
    try {
      const tasks = await complianceAPI.getTasks(params)
      return tasks
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks')
    }
  }
)

export const fetchReports = createAsyncThunk(
  'compliance/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const reports = await complianceAPI.getReports()
      return reports
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports')
    }
  }
)

const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.isLoading = false
        state.workflows = action.payload
        state.error = null
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload
      })
  },
})

export const { clearError } = complianceSlice.actions
export default complianceSlice.reducer
