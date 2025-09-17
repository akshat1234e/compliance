'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { 
  ArrowPathIcon, 
  Cog6ToothIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline'

// TypeScript interfaces
interface ConnectorStatus {
  isConnected: boolean
  lastActivity: string
  responseTime: number
  errorRate: number
}

interface ConnectorStatusMap {
  [key: string]: ConnectorStatus
}

interface ConnectorStatusGridProps {
  connectors: ConnectorStatusMap | undefined
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

// Inline components to fix deployment
function ConnectorStatusGrid({ connectors }: ConnectorStatusGridProps) {
  if (!connectors) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(connectors).map(([name, status]) => (
        <div key={name} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold capitalize">{name}</h3>
            <div className={`h-3 w-3 rounded-full ${status.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>
                {status.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Response Time:</span>
              <span>{status.responseTime}ms</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`} />
}

// Constants
const MOCK_API_DELAY = 1000
const FIVE_MINUTES_MS = 300000

// Mock API function for development
const fetchConnectorStatus = async (): Promise<ConnectorStatusMap> => {
  await new Promise(resolve => setTimeout(resolve, MOCK_API_DELAY))
  
  const now = new Date().toISOString()
  const fiveMinutesAgo = new Date(Date.now() - FIVE_MINUTES_MS).toISOString()
  
  return {
    temenos: {
      isConnected: true,
      lastActivity: now,
      responseTime: 120,
      errorRate: 0.02
    },
    finacle: {
      isConnected: true,
      lastActivity: now,
      responseTime: 95,
      errorRate: 0.01
    },
    flexcube: {
      isConnected: false,
      lastActivity: fiveMinutesAgo,
      responseTime: 0,
      errorRate: 1.0
    },
    rbi: {
      isConnected: true,
      lastActivity: now,
      responseTime: 200,
      errorRate: 0.05
    },
    cibil: {
      isConnected: true,
      lastActivity: now,
      responseTime: 150,
      errorRate: 0.03
    }
  }
}

export default function ConnectorsPage() {
  const { data: connectorStatus, isLoading, error, refetch } = useQuery(
    {
      queryKey: ['connector-status'],
      queryFn: fetchConnectorStatus,
      refetchInterval: 30000,
    }
  )

  const connectedCount = useMemo(() => 
    connectorStatus ? Object.values(connectorStatus).filter(c => c.isConnected).length : 0,
    [connectorStatus]
  )
  
  const totalCount = useMemo(() => 
    connectorStatus ? Object.keys(connectorStatus).length : 0,
    [connectorStatus]
  )

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