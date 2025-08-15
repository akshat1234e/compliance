import axios, { AxiosInstance, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'

    // Handle specific error codes
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', credentials),

  logout: () =>
    apiClient.post('/api/auth/logout'),

  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),

  refreshToken: () =>
    apiClient.post('/api/auth/refresh'),

  register: (userData: any) =>
    apiClient.post('/api/auth/register', userData),
}

// Export aliases for backward compatibility
export const authApi = authAPI

// Gateway API
export const gatewayAPI = {
  getConnectorStatus: () =>
    apiClient.get('/api/gateway/connectors/status'),

  executeRequest: (request: any) =>
    apiClient.post('/api/gateway/execute', request),

  getConnectorMetrics: (connectorId?: string) =>
    connectorId
      ? apiClient.get(`/api/gateway/connectors/${connectorId}/metrics`)
      : apiClient.get('/api/gateway/connectors/metrics'),
}

// Monitoring API
export const monitoringAPI = {
  getSystemHealth: () =>
    apiClient.get('/api/monitoring/health'),

  getConnectorMetrics: (connectorId?: string) =>
    connectorId
      ? apiClient.get(`/api/monitoring/connectors/${connectorId}`)
      : apiClient.get('/api/monitoring/connectors'),

  getSystemMetrics: (limit?: number) =>
    apiClient.get('/api/monitoring/metrics/system', { params: { limit } }),

  getPerformanceMetrics: () =>
    apiClient.get('/api/monitoring/metrics/performance'),

  getAlerts: (resolved?: boolean) =>
    apiClient.get('/api/monitoring/alerts', { params: { resolved } }),

  resolveAlert: (alertId: string) =>
    apiClient.post(`/api/monitoring/alerts/${alertId}/resolve`),

  getDashboardSummary: () =>
    apiClient.get('/api/monitoring/dashboard'),

  createHealthCheck: (healthCheck: any) =>
    apiClient.post('/api/monitoring/health/checks', healthCheck),

  deleteHealthCheck: (id: string) =>
    apiClient.delete(`/api/monitoring/health/checks/${id}`),
}

// Webhook API
export const webhookAPI = {
  getEndpoints: () =>
    apiClient.get('/api/webhooks/endpoints'),

  createEndpoint: (endpoint: any) =>
    apiClient.post('/api/webhooks/endpoints', endpoint),

  updateEndpoint: (id: string, updates: any) =>
    apiClient.put(`/api/webhooks/endpoints/${id}`, updates),

  deleteEndpoint: (id: string) =>
    apiClient.delete(`/api/webhooks/endpoints/${id}`),

  testEndpoint: (id: string) =>
    apiClient.post(`/api/webhooks/endpoints/${id}/test`),

  getDeliveries: (params?: any) =>
    apiClient.get('/api/webhooks/deliveries', { params }),

  publishEvent: (event: any) =>
    apiClient.post('/api/webhooks/events', event),

  getStats: () =>
    apiClient.get('/api/webhooks/stats'),
}

// Compliance API
export const complianceAPI = {
  getWorkflows: () =>
    apiClient.get('/api/compliance/workflows'),

  createWorkflow: (workflow: any) =>
    apiClient.post('/api/compliance/workflows', workflow),

  updateWorkflow: (id: string, updates: any) =>
    apiClient.put(`/api/compliance/workflows/${id}`, updates),

  executeWorkflow: (id: string, data?: any) =>
    apiClient.post(`/api/compliance/workflows/${id}/execute`, data),

  getTasks: (params?: any) =>
    apiClient.get('/api/compliance/tasks', { params }),

  updateTask: (id: string, updates: any) =>
    apiClient.put(`/api/compliance/tasks/${id}`, updates),

  getReports: () =>
    apiClient.get('/api/compliance/reports'),

  generateReport: (reportConfig: any) =>
    apiClient.post('/api/compliance/reports/generate', reportConfig),
}

// Regulatory API
export const regulatoryAPI = {
  getCirculars: (params?: any) =>
    apiClient.get('/api/regulatory/circulars', { params }),

  getCircular: (id: string) =>
    apiClient.get(`/api/regulatory/circulars/${id}`),

  getUpdates: () =>
    apiClient.get('/api/regulatory/updates'),

  getImpactAnalysis: (circularId: string) =>
    apiClient.get(`/api/regulatory/circulars/${circularId}/impact-analysis`),

  createImpactAnalysis: (circularId: string, analysis: any) =>
    apiClient.post(`/api/regulatory/circulars/${circularId}/impact-analysis`, analysis),

  updateCircularStatus: (circularId: string, status: string) =>
    apiClient.put(`/api/regulatory/circulars/${circularId}/status`, { status }),

  getComplianceTracker: (params?: any) =>
    apiClient.get('/api/regulatory/compliance-tracker', { params }),

  createComplianceTask: (task: any) =>
    apiClient.post('/api/regulatory/compliance-tasks', task),

  updateComplianceTask: (taskId: string, updates: any) =>
    apiClient.put(`/api/regulatory/compliance-tasks/${taskId}`, updates),

  getComplianceTasks: (params?: any) =>
    apiClient.get('/api/regulatory/compliance-tasks', { params }),

  generateComplianceReport: (params: any) =>
    apiClient.post('/api/regulatory/reports/generate', params),

  getComplianceReports: () =>
    apiClient.get('/api/regulatory/reports'),
}

// Risk API
export const riskAPI = {
  getAssessments: () =>
    apiClient.get('/api/risk/assessments'),

  createAssessment: (assessment: any) =>
    apiClient.post('/api/risk/assessments', assessment),

  getScores: (entityId?: string) =>
    entityId
      ? apiClient.get(`/api/risk/scores/${entityId}`)
      : apiClient.get('/api/risk/scores'),

  getRiskMetrics: () =>
    apiClient.get('/api/risk/metrics'),
}

// Document API
export const documentAPI = {
  getDocuments: (params?: any) =>
    apiClient.get('/api/documents', { params }),

  uploadDocument: (file: File, metadata?: any) => {
    const formData = new FormData()
    formData.append('file', file)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }
    return apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deleteDocument: (id: string) =>
    apiClient.delete(`/api/documents/${id}`),

  getTemplates: () =>
    apiClient.get('/api/documents/templates'),
}

// Export aliases for backward compatibility
export const complianceApi = complianceAPI
export const regulatoryApi = regulatoryAPI
export const monitoringApi = monitoringAPI
export const webhooksApi = webhookAPI

// Export the main API client for custom requests
export { apiClient }
export default apiClient
