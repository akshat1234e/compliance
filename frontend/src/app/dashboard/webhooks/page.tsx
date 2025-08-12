'use client'

import { useQuery } from 'react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { WebhookActivityPanel } from '@/components/dashboard/WebhookActivityPanel'
import { webhookAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function WebhooksPage() {
  const { data: webhookStats, isLoading, error } = useQuery(
    'webhook-stats',
    webhookAPI.getStats,
    { refetchInterval: 30000 }
  )

  const { data: endpoints, isLoading: endpointsLoading } = useQuery(
    'webhook-endpoints',
    webhookAPI.getEndpoints
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Webhook Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage webhook endpoints and monitor delivery status
          </p>
        </div>

        {isLoading || endpointsLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Webhook Activity */}
            <div>
              <WebhookActivityPanel stats={webhookStats} />
            </div>

            {/* Webhook Endpoints */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Endpoints</h3>
              
              {endpoints && endpoints.length > 0 ? (
                <div className="space-y-3">
                  {endpoints.map((endpoint: any) => (
                    <div key={endpoint.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{endpoint.name}</h4>
                          <p className="text-sm text-gray-500">{endpoint.url}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          endpoint.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Events: {endpoint.events?.join(', ') || 'All'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No webhook endpoints configured</p>
                  <button className="mt-2 text-indigo-600 hover:text-indigo-500">
                    Add Endpoint
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
