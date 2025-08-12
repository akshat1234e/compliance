'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface ConnectorStatusGridProps {
  connectors: any
}

const connectorDisplayNames = {
  temenos: 'Temenos T24',
  finacle: 'Finacle',
  flexcube: 'Oracle Flexcube',
  rbi: 'RBI API',
  cibil: 'CIBIL',
}

export function ConnectorStatusGrid({ connectors }: ConnectorStatusGridProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'disconnected':
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'disconnected':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const connectorList = connectors ? Object.entries(connectors) : []

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Banking Connectors</h3>
        <span className="text-sm text-gray-500">
          {connectorList.filter(([_, status]: any) => status?.isConnected).length} of {connectorList.length} connected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {connectorList.map(([connectorId, status]: any) => (
          <div
            key={connectorId}
            className={clsx(
              'border rounded-lg p-4 transition-colors',
              getStatusColor(status?.isConnected ? 'connected' : 'disconnected')
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                {connectorDisplayNames[connectorId as keyof typeof connectorDisplayNames] || connectorId}
              </h4>
              {getStatusIcon(status?.isConnected ? 'connected' : 'disconnected')}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium capitalize">
                  {status?.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {status?.lastActivity && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Activity</span>
                  <span className="font-medium">
                    {new Date(status.lastActivity).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {status?.responseTime && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Response Time</span>
                  <span className="font-medium">{status.responseTime}ms</span>
                </div>
              )}

              {status?.errorRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Error Rate</span>
                  <span className="font-medium">
                    {(status.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Connection indicator */}
            <div className="mt-3 flex items-center">
              <div
                className={clsx(
                  'h-2 w-2 rounded-full mr-2',
                  status?.isConnected ? 'bg-green-400' : 'bg-red-400'
                )}
              />
              <span className="text-xs text-gray-500">
                {status?.isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {connectorList.length === 0 && (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No connectors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connectors will appear here once they are configured and running.
          </p>
        </div>
      )}
    </div>
  )
}
