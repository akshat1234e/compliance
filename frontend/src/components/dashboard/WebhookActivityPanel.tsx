'use client'

import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface WebhookActivityPanelProps {
  stats: any
}

export function WebhookActivityPanel({ stats }: WebhookActivityPanelProps) {
  // Mock data for demonstration
  const mockStats = {
    totalDeliveries: 1250,
    successfulDeliveries: 1198,
    failedDeliveries: 52,
    pendingDeliveries: 8,
    successRate: 95.8,
    averageResponseTime: 145,
    recentDeliveries: [
      {
        id: '1',
        endpoint: 'Customer Events',
        status: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        responseTime: 120,
      },
      {
        id: '2',
        endpoint: 'Transaction Alerts',
        status: 'failed',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        responseTime: 0,
        error: 'Connection timeout',
      },
      {
        id: '3',
        endpoint: 'Compliance Updates',
        status: 'success',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        responseTime: 89,
      },
      {
        id: '4',
        endpoint: 'Risk Assessments',
        status: 'pending',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        responseTime: 0,
      },
    ],
  }

  const webhookStats = stats || mockStats

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const deliveryTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - deliveryTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    return `${diffInHours}h ago`
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Webhook Activity</h3>
        <span className="text-sm text-gray-500">
          {webhookStats.successRate?.toFixed(1)}% success rate
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-semibold text-green-600">
            {webhookStats.successfulDeliveries || 0}
          </div>
          <div className="text-xs text-gray-500">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600">
            {webhookStats.failedDeliveries || 0}
          </div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-yellow-600">
            {webhookStats.pendingDeliveries || 0}
          </div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Deliveries</h4>
        <div className="space-y-3">
          {webhookStats.recentDeliveries?.slice(0, 4).map((delivery: any) => (
            <div key={delivery.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                {getStatusIcon(delivery.status)}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {delivery.endpoint}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(delivery.timestamp)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(delivery.status)}`}
                >
                  {delivery.status}
                </span>
                {delivery.responseTime > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {delivery.responseTime}ms
                  </div>
                )}
                {delivery.error && (
                  <div className="text-xs text-red-500 mt-1">
                    {delivery.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
          View all deliveries →
        </button>
      </div>
    </div>
  )
}
