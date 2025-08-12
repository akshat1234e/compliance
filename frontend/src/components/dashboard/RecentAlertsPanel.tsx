'use client'

import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface RecentAlertsPanelProps {
  alerts: any
}

export function RecentAlertsPanel({ alerts }: RecentAlertsPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const mockAlerts = [
    {
      id: '1',
      title: 'High Error Rate: Temenos Connector',
      severity: 'high',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      resolved: false,
    },
    {
      id: '2',
      title: 'Memory Usage Above Threshold',
      severity: 'medium',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      resolved: false,
    },
    {
      id: '3',
      title: 'Webhook Delivery Failed',
      severity: 'low',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolved: true,
    },
  ]

  const alertsToShow = mockAlerts // Use mock data for now

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
        <span className="text-sm text-gray-500">
          {alerts?.total || alertsToShow.filter(a => !a.resolved).length} active
        </span>
      </div>

      <div className="space-y-3">
        {alertsToShow.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={clsx(
              'p-3 rounded-lg border',
              alert.resolved ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {alert.resolved ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={clsx(
                    'text-sm font-medium',
                    alert.resolved ? 'text-gray-500' : 'text-gray-900'
                  )}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(alert.timestamp)}
                  </p>
                </div>
              </div>
              <span
                className={clsx(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                  getSeverityColor(alert.severity)
                )}
              >
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>

      {alertsToShow.length === 0 && (
        <div className="text-center py-8">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
          <p className="mt-1 text-sm text-gray-500">
            All systems are running normally.
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
          View all alerts →
        </button>
      </div>
    </div>
  )
}
