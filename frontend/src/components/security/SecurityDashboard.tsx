'use client'

import { ShieldCheckIcon, ExclamationTriangleIcon, KeyIcon } from '@heroicons/react/24/outline'

const securityMetrics = [
  { name: 'Security Score', value: '94%', status: 'good', trend: '+2%' },
  { name: 'Active Sessions', value: '12', status: 'normal', trend: '+1' },
  { name: 'Failed Logins', value: '3', status: 'warning', trend: '-2' },
  { name: 'API Calls', value: '1.2K', status: 'good', trend: '+15%' }
]

const securityEvents = [
  { id: 1, type: 'login', message: 'Successful login from admin@company.com', time: '2 min ago', severity: 'info' },
  { id: 2, type: 'auth', message: 'JWT token refreshed', time: '5 min ago', severity: 'info' },
  { id: 3, type: 'security', message: 'Failed login attempt detected', time: '10 min ago', severity: 'warning' },
  { id: 4, type: 'access', message: 'RBAC policy updated', time: '15 min ago', severity: 'info' }
]

export function SecurityDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        {securityMetrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className="text-sm text-green-600">{metric.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Security Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">OAuth 2.0</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">JWT Authentication</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Enabled
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RBAC</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Configured
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Encryption</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                End-to-End
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            Recent Security Events
          </h3>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3">
                <KeyIcon className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}