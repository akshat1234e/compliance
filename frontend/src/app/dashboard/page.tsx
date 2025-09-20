'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BellIcon,
  LinkIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

const stats = [
  {
    name: 'Compliance Score',
    stat: '94%',
    icon: ShieldCheckIcon,
    change: '+2.1%',
    changeType: 'increase',
    href: '/dashboard/compliance',
  },
  {
    name: 'Active Risks',
    stat: '12',
    icon: ExclamationTriangleIcon,
    change: '-3',
    changeType: 'decrease',
    href: '/dashboard/risk',
  },
  {
    name: 'Pending Tasks',
    stat: '23',
    icon: DocumentTextIcon,
    change: '+5',
    changeType: 'increase',
    href: '/dashboard/workflows',
  },
  {
    name: 'System Health',
    stat: '98%',
    icon: ChartBarIcon,
    change: '+0.5%',
    changeType: 'increase',
    href: '/dashboard/connectors',
  },
]

const quickActions = [
  {
    name: 'View Analytics',
    description: 'Comprehensive compliance and risk analytics',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
    color: 'bg-blue-500',
  },
  {
    name: 'Risk Assessment',
    description: 'Review and manage compliance risks',
    href: '/dashboard/risk',
    icon: ExclamationTriangleIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'Regulatory Updates',
    description: 'Latest RBI circulars and notifications',
    href: '/dashboard/regulatory',
    icon: BellIcon,
    color: 'bg-green-500',
  },
  {
    name: 'System Integrations',
    description: 'Manage external system connections',
    href: '/dashboard/integrations',
    icon: LinkIcon,
    color: 'bg-purple-500',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'compliance',
    title: 'KYC Documentation Review Completed',
    time: '2 hours ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'risk',
    title: 'High Risk Alert: Digital Payment Security',
    time: '4 hours ago',
    status: 'pending',
  },
  {
    id: 3,
    type: 'regulatory',
    title: 'New RBI Circular on Digital Lending',
    time: '1 day ago',
    status: 'new',
  },
  {
    id: 4,
    type: 'integration',
    title: 'Core Banking System Sync Completed',
    time: '2 days ago',
    status: 'completed',
  },
]

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div>
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your compliance operations.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8">
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div 
              key={item.name} 
              onClick={() => router.push(item.href)}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <dt>
                <div className="absolute bg-blue-500 rounded-md p-3">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">{item.name}</p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.changeType === 'increase' ? (
                    <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="self-center flex-shrink-0 h-5 w-5 text-red-500" />
                  )}
                  <span className="sr-only">{item.changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
                  {item.change}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`${action.color} rounded-lg inline-flex p-3 text-white`}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.status === 'completed' ? 'bg-green-100' :
                          activity.status === 'pending' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <div className={`h-2 w-2 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-400' :
                            activity.status === 'pending' ? 'bg-yellow-400' : 'bg-blue-400'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}