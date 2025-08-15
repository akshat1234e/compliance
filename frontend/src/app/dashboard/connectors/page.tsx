'use client'

import { useQuery } from 'react-query'
import { ConnectorStatusGrid } from '@/components/dashboard/ConnectorStatusGrid'
import { LoadingSpinner } from '@/components/ui/Loading'
import { 
  ArrowPathIcon, 
  Cog6ToothIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline'

// Mock API function for development
const fetchConnectorStatus = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return {
    temenos: {
      isConnected: true,
      lastActivity: new Date().toISOString(),
      responseTime: 120,
      errorRate: 0.02
    },
    finacle: {
      isConnected: true,
      lastActivity: new Date().toISOString(),
      responseTime: 95,
      errorRate: 0.01
    },
    flexcube: {
      isConnected: false,
      lastActivity: new Date(Date.now() - 300000).toISOString(),
      responseTime: 0,
      errorRate: 1.0
    },
    rbi: {
      isConnected: true,
      lastActivity: new Date().toISOString(),
      responseTime: 200,
      errorRate: 0.05
    },
    cibil: {
      isConnected: true,
      lastActivity: new Date().toISOString(),
      responseTime: 150,
      errorRate: 0.03
    }
  }
}

export default function ConnectorsPage() {
  const { data: connectorStatus, isLoading, error, refetch } = useQuery(
    'connector-status',
    fetchConnectorStatus,
    {
      refetchInterval: 30000,
    }
  )

  const connectedCount = connectorStatus ? 
    Object.values(connectorStatus).filter((c: any) => c?.isConnected).length : 0
  const totalCount = connectorStatus ? Object.keys(connectorStatus).length : 0

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Banking Connectors
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage connections to banking core systems
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="flex items-center px-3 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
            <Cog6ToothIcon className="h-4 w-4 mr-2" />
            Configure
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disconnected</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount - connectedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Health Score</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connectors Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Failed to load connector status</div>
          <button
            onClick={() => refetch()}
            className="text-brand-600 hover:text-brand-500 font-medium"
          >
            Try again
          </button>
        </div>
      ) : (
        <ConnectorStatusGrid connectors={connectorStatus} />
      )}
    </div>
  )
}
