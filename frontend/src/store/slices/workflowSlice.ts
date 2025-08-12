import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { complianceAPI } from '@/services/api'

interface WorkflowState {
  workflows: any[]
  activeWorkflow: any | null
  executionHistory: any[]
  isLoading: boolean
  error: string | null
}

const initialState: WorkflowState = {
  workflows: [],
  activeWorkflow: null,
  executionHistory: [],
  isLoading: false,
  error: null,
}

export const createWorkflow = createAsyncThunk(
  'workflow/create',
  async (workflow: any, { rejectWithValue }) => {
    try {
      const newWorkflow = await complianceAPI.createWorkflow(workflow)
      return newWorkflow
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workflow')
    }
  }
)

export const executeWorkflow = createAsyncThunk(
  'workflow/execute',
  async ({ id, data }: { id: string; data?: any }, { rejectWithValue }) => {
    try {
      const result = await complianceAPI.executeWorkflow(id, data)
      return result
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute workflow')
    }
  }
)

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setActiveWorkflow: (state, action) => {
      state.activeWorkflow = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createWorkflow.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.isLoading = false
        state.workflows.push(action.payload)
        state.error = null
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(executeWorkflow.fulfilled, (state, action) => {
        state.executionHistory.unshift(action.payload)
      })
  },
})

export const { clearError, setActiveWorkflow } = workflowSlice.actions
export default workflowSlice.reducer
