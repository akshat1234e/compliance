'use client'

import {
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    LinkIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useState } from 'react'
// import { toast } from 'react-hot-toast'

// Mock data for development
const mockIntegrations = [
  {
    id: '1',
    name: 'Core Banking System',
    type: 'banking',
    provider: 'Temenos T24',
    status: 'connected',
    lastSync: '2024-01-15T10:30:00Z',
    description: 'Integration with core banking system for transaction monitoring',
    endpoint: 'https://api.temenos.com/v1',
    authType: 'oauth2',
    dataTypes: ['transactions', 'accounts', 'customers'],
    syncFrequency: 'real-time',
    healthScore: 98
  },
  {
    id: '2',
    name: 'Risk Management Platform',
    type: 'risk',
    provider: 'SAS Risk Management',
    status: 'connected',
    lastSync: '2024-01-15T09:45:00Z',
    description: 'Integration for risk assessment and monitoring',
    endpoint: 'https://api.sas.com/risk/v2',
    authType: 'api_key',
    dataTypes: ['risk_scores', 'assessments', 'alerts'],
    syncFrequency: 'hourly',
    healthScore: 95
  },
  {
    id: '3',
    name: 'Document Management System',
    type: 'document',
    provider: 'SharePoint Online',
    status: 'error',
    lastSync: '2024-01-14T16:20:00Z',
    description: 'Document storage and compliance documentation',
    endpoint: 'https://graph.microsoft.com/v1.0',
    authType: 'oauth2',
    dataTypes: ['documents', 'metadata', 'versions'],
    syncFrequency: 'daily',
    healthScore: 45,
    error: 'Authentication token expired'
  },
  {
    id: '4',
    name: 'Regulatory Data Feed',
    type: 'regulatory',
    provider: 'Thomson Reuters',
    status: 'pending',
    lastSync: null,
    description: 'Real-time regulatory updates and circulars',
    endpoint: 'https://api.thomsonreuters.com/regulatory/v1',
    authType: 'api_key',
    dataTypes: ['circulars', 'updates', 'notifications'],
    syncFrequency: 'real-time',
    healthScore: null
  },
  {
    id: '5',
    name: 'Audit Trail System',
    type: 'audit',
    provider: 'IBM OpenPages',
    status: 'connected',
    lastSync: '2024-01-15T08:15:00Z',
    description: 'Audit trail and compliance monitoring',
    endpoint: 'https://api.ibm.com/openpages/v1',
    authType: 'oauth2',
    dataTypes: ['audit_logs', 'compliance_data', 'reports'],
    syncFrequency: 'daily',
    healthScore: 92
  }
]

const integrationTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'banking', label: 'Banking Systems' },
  { value: 'risk', label: 'Risk Management' },
  { value: 'document', label: 'Document Management' },
  { value: 'regulatory', label: 'Regulatory Data' },
  { value: 'audit', label: 'Audit Systems' }
]

const authTypes = [
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'api_key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'jwt', label: 'JWT Token' }
]

const syncFrequencies = [
  { value: 'real-time', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
]

export default function IntegrationsPage() {
  const [selectedType, setSelectedType] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const queryClient = useQueryClient()

  // Fetch integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations', selectedType],
    queryFn: async () => {
      try {
        const response = await fetch('/api/integrations?' + new URLSearchParams({
          type: selectedType !== 'all' ? selectedType : ''
        }))

        if (!response.ok) {
          throw new Error('API not available')
        }

        return await response.json()
      } catch (error) {
        console.log('Using mock data for integrations')
        return mockIntegrations.filter(integration =>
          selectedType === 'all' || integration.type === selectedType
        )
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Connection test failed')
      }
      return response.json()
    },
    onSuccess: () => {
      console.log('Connection test successful')
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (error) => {
      console.error('Connection test failed:', error)
    },
  })

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Sync failed')
      }
      return response.json()
    },
    onSuccess: () => {
      console.log('Sync initiated successfully')
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (error) => {
      console.error('Sync failed:', error)
    },
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      connected: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || styles.disconnected
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTestConnection = (integrationId: string) => {
    testConnectionMutation.mutate(integrationId)
  }

  const handleSyncIntegration = (integrationId: string) => {
    syncIntegrationMutation.mutate(integrationId)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage external system connections and data synchronization
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Integration
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LinkIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Integrations</dt>
                  <dd className="text-lg font-medium text-gray-900">{integrations.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Connected</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {integrations.filter(i => i.status === 'connected').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {integrations.filter(i => i.status === 'error').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {integrations.filter(i => i.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-gray-700">Filter by Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            {integrationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Integrations List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Integrations ({integrations.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-6 text-center">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first integration.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(integration.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {integration.name}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(integration.status)}`}>
                          {integration.status}
                        </span>
                        {integration.healthScore !== null && (
                          <span className={`text-xs font-medium ${getHealthScoreColor(integration.healthScore)}`}>
                            Health: {integration.healthScore}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{integration.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-xs text-gray-500">
                        <span>Provider: {integration.provider}</span>
                        <span>Type: {integration.type}</span>
                        <span>Auth: {integration.authType}</span>
                        <span>Sync: {integration.syncFrequency}</span>
                        <span>Last Sync: {formatLastSync(integration.lastSync)}</span>
                      </div>
                      {integration.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Error: {integration.error}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {integration.dataTypes.map((dataType) => (
                          <span
                            key={dataType}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {dataType}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTestConnection(integration.id)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Test connection"
                      disabled={testConnectionMutation.isLoading}
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleSyncIntegration(integration.id)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Sync now"
                      disabled={syncIntegrationMutation.isLoading}
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="View details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Edit integration"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-500"
                      title="Delete integration"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Integration Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Integration</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Integration Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter integration name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select type</option>
                    {integrationTypes.slice(1).map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter provider name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Endpoint URL</label>
                  <input
                    type="url"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://api.example.com/v1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Authentication Type</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select auth type</option>
                    {authTypes.map((auth) => (
                      <option key={auth.value} value={auth.value}>
                        {auth.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sync Frequency</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Select frequency</option>
                    {syncFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter integration description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Integration added successfully')
                    setIsCreateModalOpen(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Integration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
