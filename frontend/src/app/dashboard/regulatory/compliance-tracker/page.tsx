'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { regulatoryAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function ComplianceTrackerPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('3months')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data: complianceData, isLoading } = useQuery(
    ['compliance-tracker', selectedTimeframe, selectedCategory],
    () => regulatoryAPI.getCirculars({ 
      timeframe: selectedTimeframe,
      category: selectedCategory !== 'all' ? selectedCategory : undefined
    }),
    { refetchInterval: 300000 }
  )

  // Mock data for demonstration
  const mockComplianceData = {
    summary: {
      totalCirculars: 24,
      compliant: 18,
      pending: 4,
      overdue: 2,
      complianceRate: 75
    },
    trends: [
      { month: 'Oct', compliant: 15, pending: 3, overdue: 1 },
      { month: 'Nov', compliant: 16, pending: 4, overdue: 1 },
      { month: 'Dec', compliant: 17, pending: 3, overdue: 2 },
      { month: 'Jan', compliant: 18, pending: 4, overdue: 2 }
    ],
    statusDistribution: [
      { name: 'Compliant', value: 18, color: '#10B981' },
      { name: 'Pending', value: 4, color: '#F59E0B' },
      { name: 'Overdue', value: 2, color: '#EF4444' }
    ],
    upcomingDeadlines: [
      {
        id: 'RBI/2024/004',
        title: 'Updated Liquidity Risk Management Guidelines',
        deadline: '2024-02-15',
        daysLeft: 12,
        priority: 'high',
        assignee: 'Risk Management Team',
        progress: 80
      },
      {
        id: 'RBI/2024/005',
        title: 'Cyber Security Framework Updates',
        deadline: '2024-02-28',
        daysLeft: 25,
        priority: 'medium',
        assignee: 'IT Security Team',
        progress: 45
      },
      {
        id: 'RBI/2024/006',
        title: 'Customer Grievance Redressal Mechanism',
        deadline: '2024-03-10',
        daysLeft: 35,
        priority: 'medium',
        assignee: 'Customer Service Team',
        progress: 20
      }
    ],
    recentActions: [
      {
        id: 1,
        action: 'Completed KYC compliance assessment',
        circular: 'RBI/2024/002',
        user: 'John Doe',
        timestamp: '2024-01-20T10:30:00Z',
        type: 'completion'
      },
      {
        id: 2,
        action: 'Updated risk management framework',
        circular: 'RBI/2024/003',
        user: 'Jane Smith',
        timestamp: '2024-01-19T15:45:00Z',
        type: 'update'
      },
      {
        id: 3,
        action: 'Assigned new compliance task',
        circular: 'RBI/2024/004',
        user: 'Mike Johnson',
        timestamp: '2024-01-18T09:15:00Z',
        type: 'assignment'
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
        return <ChartBarIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDaysLeftColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600'
    if (daysLeft <= 14) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Compliance Tracker
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor compliance status and track regulatory deadlines
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <Button variant="primary" className="flex items-center">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Compliance Task
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Circulars</dt>
                    <dd className="text-lg font-medium text-gray-900">{mockComplianceData.summary.totalCirculars}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Compliant</dt>
                    <dd className="text-lg font-medium text-gray-900">{mockComplianceData.summary.compliant}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-gray-900">{mockComplianceData.summary.pending}</dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-gray-900">{mockComplianceData.summary.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Compliance Trends */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockComplianceData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Line type="monotone" dataKey="compliant" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="overdue" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockComplianceData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {mockComplianceData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {mockComplianceData.upcomingDeadlines.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority} priority
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span className="font-medium">{item.id}</span>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {item.assignee}
                      </div>
                      <div className={`font-medium ${getDaysLeftColor(item.daysLeft)}`}>
                        {item.daysLeft} days left
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{item.progress}%</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(item.progress)}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex-shrink-0">
                    <Button variant="outline" size="sm" className="flex items-center">
                      View Details
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {mockComplianceData.recentActions.map((action) => (
              <div key={action.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {action.type === 'completion' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {action.type === 'update' && <ChartBarIcon className="h-5 w-5 text-blue-500" />}
                    {action.type === 'assignment' && <UserIcon className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{action.action}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Circular: {action.circular}</span>
                      <span>By: {action.user}</span>
                      <span>{new Date(action.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
