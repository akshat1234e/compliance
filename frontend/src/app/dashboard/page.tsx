'use client'

import Link from 'next/link'
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { CompliancePieChart, ComplianceTrendChart } from '@/components/charts/ComplianceChart'

const stats = [
  { name: 'Active Connectors', value: '4/5', change: '+1', changeType: 'positive' },
  { name: 'Compliance Score', value: '94%', change: '+2%', changeType: 'positive' },
  { name: 'Open Tasks', value: '12', change: '-3', changeType: 'positive' },
  { name: 'Risk Level', value: 'Low', change: 'Stable', changeType: 'neutral' },
]

const quickActions = [
  {
    name: 'View Connectors',
    description: 'Monitor banking system connections',
    href: '/dashboard/connectors',
    icon: ChartBarIcon,
    color: 'bg-blue-500'
  },
  {
    name: 'Compliance Dashboard',
    description: 'Track regulatory compliance',
    href: '/dashboard/compliance',
    icon: ShieldCheckIcon,
    color: 'bg-green-500'
  },
  {
    name: 'Risk Assessment',
    description: 'Review risk metrics',
    href: '/dashboard/risk',
    icon: ExclamationTriangleIcon,
    color: 'bg-orange-500'
  },
  {
    name: 'Document Center',
    description: 'Manage compliance documents',
    href: '/dashboard/documents',
    icon: DocumentTextIcon,
    color: 'bg-purple-500'
  },
]

const recentActivity = [
  { id: 1, action: 'Temenos connector restored', status: 'success', time: '2 minutes ago' },
  { id: 2, action: 'Compliance report generated', status: 'success', time: '15 minutes ago' },
  { id: 3, action: 'Flexcube connection failed', status: 'error', time: '1 hour ago' },
  { id: 4, action: 'Risk assessment completed', status: 'success', time: '2 hours ago' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your RegTech compliance management platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${action.color} rounded-lg p-3`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-brand-600">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CompliancePieChart />
        <ComplianceTrendChart />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CompliancePieChart />
        <ComplianceTrendChart />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                {activity.status === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Gateway</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Message Queue</span>
              <span className="flex items-center text-sm text-green-600">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Services</span>
              <span className="flex items-center text-sm text-yellow-600">
                <div className="h-2 w-2 bg-yellow-400 rounded-full mr-2"></div>
                Degraded
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}