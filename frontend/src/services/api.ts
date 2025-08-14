import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies (refresh tokens)
})

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const response = await api.post('/auth/refresh')
        const { token } = response.data
        
        localStorage.setItem('token', token)
        originalRequest.headers.Authorization = `Bearer ${token}`
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API Response type
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: any[]
}

// Generic API methods
class ApiService {
  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await api.get(url, config)
    return response.data
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await api.post(url, data, config)
    return response.data
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await api.put(url, data, config)
    return response.data
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await api.patch(url, data, config)
    return response.data
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await api.delete(url, config)
    return response.data
  }

  // File upload
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('document', file)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }

    const response: AxiosResponse<ApiResponse<T>> = await api.post(url, formData, config)
    return response.data
  }
}

// Create service instance
const apiService = new ApiService()

// Specific API endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),
  
  register: (userData: { email: string; password: string; name: string; role?: string }) =>
    apiService.post('/auth/register', userData),
  
  logout: () =>
    apiService.post('/auth/logout'),
  
  getCurrentUser: () =>
    apiService.get('/auth/me'),
  
  refreshToken: () =>
    apiService.post('/auth/refresh'),
  
  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    apiService.put('/auth/change-password', passwords),
  
  updateProfile: (profileData: any) =>
    apiService.put('/auth/profile', profileData),
}

export const dashboardApi = {
  getMetrics: () =>
    apiService.get('/dashboard/metrics'),
  
  getActivities: (params?: { limit?: number; offset?: number }) =>
    apiService.get('/dashboard/activities', { params }),
  
  getComplianceSummary: () =>
    apiService.get('/dashboard/compliance-summary'),
  
  getRiskOverview: () =>
    apiService.get('/dashboard/risk-overview'),
  
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number }) =>
    apiService.get('/dashboard/notifications', { params }),
  
  markNotificationRead: (id: string) =>
    apiService.patch(`/dashboard/notifications/${id}/read`),
  
  getSystemStatus: () =>
    apiService.get('/dashboard/system-status'),
}

export const regulatoryApi = {
  getCirculars: (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    dateFrom?: string
    dateTo?: string
    impact?: string
  }) =>
    apiService.get('/regulatory/circulars', { params }),
  
  getCircular: (id: string) =>
    apiService.get(`/regulatory/circulars/${id}`),
  
  getCategories: () =>
    apiService.get('/regulatory/categories'),
  
  syncRegulations: () =>
    apiService.post('/regulatory/sync'),
  
  createImpactAssessment: (circularId: string, assessment: any) =>
    apiService.post(`/regulatory/circulars/${circularId}/impact-assessment`, { assessment }),
  
  getComplianceStatus: (circularId: string) =>
    apiService.get(`/regulatory/circulars/${circularId}/compliance-status`),
  
  updateComplianceStatus: (circularId: string, status: string, notes?: string) =>
    apiService.patch(`/regulatory/circulars/${circularId}/compliance-status`, { status, notes }),
  
  getCalendar: (params?: { year?: number; month?: number }) =>
    apiService.get('/regulatory/calendar', { params }),
}

export const complianceApi = {
  getWorkflows: (params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    assignee?: string
    search?: string
  }) =>
    apiService.get('/compliance/workflows', { params }),
  
  getWorkflow: (id: string) =>
    apiService.get(`/compliance/workflows/${id}`),
  
  createWorkflow: (workflowData: any) =>
    apiService.post('/compliance/workflows', workflowData),
  
  updateWorkflow: (id: string, workflowData: any) =>
    apiService.put(`/compliance/workflows/${id}`, workflowData),
  
  addTask: (workflowId: string, taskData: any) =>
    apiService.post(`/compliance/workflows/${workflowId}/tasks`, taskData),
  
  updateTask: (workflowId: string, taskId: string, taskData: any) =>
    apiService.patch(`/compliance/workflows/${workflowId}/tasks/${taskId}`, taskData),
  
  addComment: (workflowId: string, message: string) =>
    apiService.post(`/compliance/workflows/${workflowId}/comments`, { message }),
  
  getTemplates: () =>
    apiService.get('/compliance/templates'),
}

export const documentsApi = {
  getDocuments: (params?: any) =>
    apiService.get('/documents', { params }),
  
  uploadDocument: (file: File, onProgress?: (progress: number) => void) =>
    apiService.upload('/documents/upload', file, onProgress),
}

export const riskApi = {
  getAssessments: (params?: any) =>
    apiService.get('/risk/assessments', { params }),
  
  createAssessment: (assessmentData: any) =>
    apiService.post('/risk/assessments', assessmentData),
}

export const analyticsApi = {
  getReports: (params?: any) =>
    apiService.get('/analytics/reports', { params }),
}

export const monitoringApi = {
  getStatus: () =>
    apiService.get('/monitoring/status'),
}

export const integrationsApi = {
  getIntegrations: () =>
    apiService.get('/integrations'),
}

export const webhooksApi = {
  getWebhooks: () =>
    apiService.get('/webhooks'),
}

export const aiApi = {
  getInsights: () =>
    apiService.get('/ai/insights'),
  
  processQuery: (query: string) =>
    apiService.post('/ai/query', { query }),
}

// Export the main api instance and service
export { api, apiService }
export default apiService
