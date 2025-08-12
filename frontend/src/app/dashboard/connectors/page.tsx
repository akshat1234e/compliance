'use client'

import { useQuery } from 'react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { ConnectorStatusGrid } from '@/components/dashboard/ConnectorStatusGrid'
import { gatewayAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function ConnectorsPage() {
  const { data: connectorStatus, isLoading, error } = useQuery(
    'connector-status',
    gatewayAPI.getConnectorStatus,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Banking Connectors
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage connections to banking core systems
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Failed to load connector status</div>
            <button 
              onClick={() => window.location.reload()}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Try again
            </button>
          </div>
        ) : (
          <ConnectorStatusGrid connectors={connectorStatus} />
        )}
      </div>
    </AppLayout>
  )
}
