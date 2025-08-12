'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface SystemHealthCardProps {
  data: any
}

export function SystemHealthCard({ data }: SystemHealthCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
      case 'unhealthy':
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50'
      case 'unhealthy':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60))
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        {getStatusIcon(data?.system?.status)}
      </div>

      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Overall Status</span>
          <span
            className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
              getStatusColor(data?.system?.status)
            )}
          >
            {data?.system?.status || 'Unknown'}
          </span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Uptime</span>
          <span className="text-sm font-medium text-gray-900">
            {data?.system?.uptime ? formatUptime(data.system.uptime) : 'N/A'}
          </span>
        </div>

        {/* Version */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Version</span>
          <span className="text-sm font-medium text-gray-900">
            {data?.system?.version || 'N/A'}
          </span>
        </div>

        {/* Environment */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Environment</span>
          <span className="text-sm font-medium text-gray-900 capitalize">
            {data?.system?.environment || 'N/A'}
          </span>
        </div>

        {/* Health Checks Summary */}
        {data?.healthChecks && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Health Checks</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-medium">{data.healthChecks.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Healthy</span>
                <span className="font-medium text-green-600">{data.healthChecks.healthy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Degraded</span>
                <span className="font-medium text-yellow-600">{data.healthChecks.degraded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unhealthy</span>
                <span className="font-medium text-red-600">{data.healthChecks.unhealthy}</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {data?.performance && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Response Time</span>
                <span className="font-medium">
                  {Math.round(data.performance.averageResponseTime)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Error Rate</span>
                <span className="font-medium">
                  {(data.performance.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Memory Usage</span>
                <span className="font-medium">
                  {data.performance.memoryUsage?.percentage?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
