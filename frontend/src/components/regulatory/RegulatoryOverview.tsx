'use client'

import { useQuery } from 'react-query'
import { regulatoryAPI } from '@/services/api'
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function RegulatoryOverview() {
  const { data: circulars, isLoading } = useQuery(
    'regulatory-overview',
    () => regulatoryAPI.getCirculars({ limit: 5, status: 'pending' }),
    { refetchInterval: 300000 }
  )

  const { data: updates } = useQuery(
    'regulatory-updates-overview',
    () => regulatoryAPI.getUpdates(),
    { refetchInterval: 300000 }
  )

  // Mock data for demonstration
  const mockData = {
    summary: {
      totalCirculars: 24,
      pendingCompliance: 6,
      upcomingDeadlines: 3,
      recentUpdates: 2
    },
    recentCirculars: circulars || [
      {
        id: 'RBI/2024/001',
        title: 'Guidelines on Digital Payment Security Framework',
        category: 'Digital Payments',
        priority: 'high',
        status: 'pending',
        deadline: '2024-03-31',
        daysLeft: 45
      },
      {
        id: 'RBI/2024/002',
        title: 'Updated KYC Norms for Banking Institutions',
        category: 'KYC/AML',
        priority: 'high',
        status: 'compliant',
        deadline: '2024-02-14',
        daysLeft: 0
      },
      {
        id: 'RBI/2024/003',
        title: 'Risk Management Framework for NBFCs',
        category: 'Risk Management',
        priority: 'medium',
        status: 'pending',
        deadline: '2024-05-31',
        daysLeft: 105
      }
    ]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'overdue':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600'
    if (daysLeft <= 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Circulars</dt>
                  <dd className="text-lg font-medium text-gray-900">{mockData.summary.totalCirculars}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Compliance</dt>
                  <dd className="text-lg font-medium text-gray-900">{mockData.summary.pendingCompliance}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Deadlines</dt>
                  <dd className="text-lg font-medium text-gray-900">{mockData.summary.upcomingDeadlines}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Updates</dt>
                  <dd className="text-lg font-medium text-gray-900">{mockData.summary.recentUpdates}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Circulars */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent RBI Circulars</h3>
          <Link href="/dashboard/regulatory">
            <Button variant="outline" size="sm" className="flex items-center">
              View All
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mockData.recentCirculars.slice(0, 3).map((circular) => (
              <div key={circular.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(circular.status)}
                      <Link 
                        href={`/dashboard/regulatory/circulars/${circular.id}`}
                        className="font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {circular.title}
                      </Link>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium">{circular.id}</span>
                      <span>•</span>
                      <span>{circular.category}</span>
                      {circular.status === 'pending' && circular.daysLeft > 0 && (
                        <>
                          <span>•</span>
                          <span className={`font-medium ${getDaysLeftColor(circular.daysLeft)}`}>
                            {circular.daysLeft} days left
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(circular.status)}`}>
                        {circular.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(circular.priority)}`}>
                        {circular.priority} Priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <Link href={`/dashboard/regulatory/circulars/${circular.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/regulatory/compliance-tracker">
            <Button variant="outline" className="w-full justify-start">
              <ClockIcon className="h-4 w-4 mr-2" />
              Compliance Tracker
            </Button>
          </Link>
          <Link href="/dashboard/regulatory/impact-analysis">
            <Button variant="outline" className="w-full justify-start">
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Impact Analysis
            </Button>
          </Link>
          <Link href="/dashboard/regulatory">
            <Button variant="outline" className="w-full justify-start">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              All Circulars
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
