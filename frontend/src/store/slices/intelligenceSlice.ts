import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

// Types for AI Intelligence System
export interface UserContext {
  currentPage: string
  currentSection?: string
  activeWorkflow?: string
  selectedRegulation?: string
  selectedDocument?: string
  userRole: 'admin' | 'compliance_officer' | 'risk_manager' | 'auditor' | 'user'
  permissionLevel: number
  sessionStartTime: number
  lastActivity: number
}

export interface AILearningData {
  frequentPages: Record<string, number>
  navigationPatterns: Array<{
    from: string
    to: string
    count: number
    avgTimeSpent: number
  }>
  taskCompletionPaths: Array<{
    taskType: string
    successfulPath: string[]
    completionTime: number
  }>
  errorPatterns: Array<{
    page: string
    errorType: string
    count: number
    recoveryActions: string[]
  }>
  searchQueries: Array<{
    query: string
    results: number
    clicked: boolean
    timestamp: number
  }>
}

export interface PredictiveIntelligence {
  suggestedNextPages: Array<{
    page: string
    confidence: number
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
  recommendedActions: Array<{
    action: string
    description: string
    confidence: number
    urgency: 'immediate' | 'today' | 'this_week' | 'this_month'
  }>
  contextualHelp: Array<{
    topic: string
    content: string
    relevance: number
  }>
  smartShortcuts: Array<{
    name: string
    path: string
    description: string
    usageCount: number
  }>
}

export interface SystemIntelligence {
  pendingNotifications: Array<{
    id: string
    type: 'regulation' | 'workflow' | 'deadline' | 'system' | 'collaboration'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
    timestamp: number
    read: boolean
    actionRequired: boolean
    suggestedActions?: string[]
  }>
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    performance: number
    uptime: number
    lastUpdate: number
  }
  collaborativePresence: Array<{
    userId: string
    userName: string
    currentPage: string
    activity: string
    timestamp: number
  }>
  dataSyncStatus: {
    lastSync: number
    pendingChanges: number
    conflicts: number
  }
}

export interface IntelligenceState {
  userContext: UserContext
  aiLearningData: AILearningData
  predictiveIntelligence: PredictiveIntelligence
  systemIntelligence: SystemIntelligence
  isLearning: boolean
  lastPredictionUpdate: number
  crossPageContext: Record<string, any>
}

// Initial state
const initialState: IntelligenceState = {
  userContext: {
    currentPage: '/dashboard',
    userRole: 'user',
    permissionLevel: 1,
    sessionStartTime: Date.now(),
    lastActivity: Date.now()
  },
  aiLearningData: {
    frequentPages: {},
    navigationPatterns: [],
    taskCompletionPaths: [],
    errorPatterns: [],
    searchQueries: []
  },
  predictiveIntelligence: {
    suggestedNextPages: [],
    recommendedActions: [],
    contextualHelp: [],
    smartShortcuts: []
  },
  systemIntelligence: {
    pendingNotifications: [],
    systemHealth: {
      status: 'healthy',
      performance: 95,
      uptime: 99.9,
      lastUpdate: Date.now()
    },
    collaborativePresence: [],
    dataSyncStatus: {
      lastSync: Date.now(),
      pendingChanges: 0,
      conflicts: 0
    }
  },
  isLearning: true,
  lastPredictionUpdate: Date.now(),
  crossPageContext: {}
}

// Async thunks for AI operations
export const updatePredictions = createAsyncThunk(
  'intelligence/updatePredictions',
  async (context: Partial<UserContext>) => {
    // Simulate AI prediction API call
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Mock AI predictions based on context
    const predictions: PredictiveIntelligence = {
      suggestedNextPages: [
        {
          page: '/dashboard/regulatory',
          confidence: 0.85,
          reason: 'New RBI circular requires review',
          priority: 'high'
        },
        {
          page: '/dashboard/workflows',
          confidence: 0.72,
          reason: 'Pending workflow approvals',
          priority: 'medium'
        }
      ],
      recommendedActions: [
        {
          action: 'review_regulation',
          description: 'Review new RBI/2024/15 circular',
          confidence: 0.9,
          urgency: 'today'
        }
      ],
      contextualHelp: [
        {
          topic: 'KYC Compliance',
          content: 'Updated guidelines for customer identification',
          relevance: 0.8
        }
      ],
      smartShortcuts: [
        {
          name: 'Quick Risk Assessment',
          path: '/dashboard/risk/quick-assessment',
          description: 'Start a new risk assessment',
          usageCount: 15
        }
      ]
    }
    
    return predictions
  }
)

export const learnFromUserAction = createAsyncThunk(
  'intelligence/learnFromUserAction',
  async (action: {
    type: 'navigation' | 'search' | 'task_completion' | 'error'
    data: any
    timestamp: number
  }) => {
    // Process learning data
    return action
  }
)

// Intelligence slice
const intelligenceSlice = createSlice({
  name: 'intelligence',
  initialState,
  reducers: {
    updateUserContext: (state, action: PayloadAction<Partial<UserContext>>) => {
      state.userContext = { ...state.userContext, ...action.payload }
      state.userContext.lastActivity = Date.now()
    },
    
    setCrossPageContext: (state, action: PayloadAction<{ key: string; value: any }>) => {
      state.crossPageContext[action.payload.key] = action.payload.value
    },
    
    clearCrossPageContext: (state, action: PayloadAction<string>) => {
      delete state.crossPageContext[action.payload]
    },
    
    addNavigationPattern: (state, action: PayloadAction<{ from: string; to: string; timeSpent: number }>) => {
      const { from, to, timeSpent } = action.payload
      const existingPattern = state.aiLearningData.navigationPatterns.find(
        p => p.from === from && p.to === to
      )
      
      if (existingPattern) {
        existingPattern.count += 1
        existingPattern.avgTimeSpent = (existingPattern.avgTimeSpent + timeSpent) / 2
      } else {
        state.aiLearningData.navigationPatterns.push({
          from,
          to,
          count: 1,
          avgTimeSpent: timeSpent
        })
      }
      
      // Update frequent pages
      state.aiLearningData.frequentPages[to] = (state.aiLearningData.frequentPages[to] || 0) + 1
    },
    
    addSearchQuery: (state, action: PayloadAction<{
      query: string
      results: number
      clicked: boolean
    }>) => {
      state.aiLearningData.searchQueries.push({
        ...action.payload,
        timestamp: Date.now()
      })
      
      // Keep only last 100 search queries
      if (state.aiLearningData.searchQueries.length > 100) {
        state.aiLearningData.searchQueries = state.aiLearningData.searchQueries.slice(-100)
      }
    },
    
    addNotification: (state, action: PayloadAction<Omit<SystemIntelligence['pendingNotifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }
      state.systemIntelligence.pendingNotifications.unshift(notification)
      
      // Keep only last 50 notifications
      if (state.systemIntelligence.pendingNotifications.length > 50) {
        state.systemIntelligence.pendingNotifications = state.systemIntelligence.pendingNotifications.slice(0, 50)
      }
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.systemIntelligence.pendingNotifications.find(
        n => n.id === action.payload
      )
      if (notification) {
        notification.read = true
      }
    },
    
    updateCollaborativePresence: (state, action: PayloadAction<SystemIntelligence['collaborativePresence']>) => {
      state.systemIntelligence.collaborativePresence = action.payload
    },
    
    updateSystemHealth: (state, action: PayloadAction<Partial<SystemIntelligence['systemHealth']>>) => {
      state.systemIntelligence.systemHealth = {
        ...state.systemIntelligence.systemHealth,
        ...action.payload,
        lastUpdate: Date.now()
      }
    },
    
    toggleLearning: (state, action: PayloadAction<boolean>) => {
      state.isLearning = action.payload
    }
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(updatePredictions.fulfilled, (state, action) => {
        state.predictiveIntelligence = action.payload
        state.lastPredictionUpdate = Date.now()
      })
      .addCase(learnFromUserAction.fulfilled, (state, action) => {
        const { type, data } = action.payload
        
        switch (type) {
          case 'navigation':
            // Already handled in addNavigationPattern
            break
          case 'search':
            // Already handled in addSearchQuery
            break
          case 'task_completion':
            state.aiLearningData.taskCompletionPaths.push(data)
            break
          case 'error':
            const existingError = state.aiLearningData.errorPatterns.find(
              e => e.page === data.page && e.errorType === data.errorType
            )
            if (existingError) {
              existingError.count += 1
            } else {
              state.aiLearningData.errorPatterns.push({
                ...data,
                count: 1
              })
            }
            break
        }
      })
  }
})

export const {
  updateUserContext,
  setCrossPageContext,
  clearCrossPageContext,
  addNavigationPattern,
  addSearchQuery,
  addNotification,
  markNotificationRead,
  updateCollaborativePresence,
  updateSystemHealth,
  toggleLearning
} = intelligenceSlice.actions

export default intelligenceSlice.reducer
