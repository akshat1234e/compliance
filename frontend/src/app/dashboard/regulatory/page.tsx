'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { regulatoryAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function RegulatoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const { data: circulars, isLoading: circularsLoading } = useQuery(
    ['regulatory-circulars', { search: searchTerm, status: filterStatus, category: filterCategory }],
    () => regulatoryAPI.getCirculars({ 
      search: searchTerm || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined
    }),
    { refetchInterval: 300000 } // Refresh every 5 minutes
  )

  const { data: updates, isLoading: updatesLoading } = useQuery(
    'regulatory-updates',
    regulatoryAPI.getUpdates,
    { refetchInterval: 300000 }
  )

  const isLoading = circularsLoading || updatesLoading

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'non_compliant':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'non_compliant':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const mockCirculars = circulars || [
    {
      id: 'RBI/2024/001',
      title: 'Guidelines on Digital Payment Security Framework',
      category: 'Digital Payments',
      issuedDate: '2024-01-15',
      effectiveDate: '2024-04-01',
      priority: 'high',
      status: 'pending',
      description: 'New guidelines for enhancing security in digital payment systems',
      impactLevel: 'high',
      complianceDeadline: '2024-03-31'
    },
    {
      id: 'RBI/2024/002',
      title: 'Updated KYC Norms for Banking Institutions',
      category: 'KYC/AML',
      issuedDate: '2024-01-10',
      effectiveDate: '2024-02-15',
      priority: 'high',
      status: 'compliant',
      description: 'Revised know your customer norms and documentation requirements',
      impactLevel: 'medium',
      complianceDeadline: '2024-02-14'
    },
    {
      id: 'RBI/2024/003',
      title: 'Risk Management Framework for NBFCs',
      category: 'Risk Management',
      issuedDate: '2024-01-05',
      effectiveDate: '2024-06-01',
      priority: 'medium',
      status: 'pending',
      description: 'Comprehensive risk management guidelines for non-banking financial companies',
      impactLevel: 'high',
      complianceDeadline: '2024-05-31'
    }
  ]

  const filteredCirculars = mockCirculars.filter(circular => {
    const matchesSearch = !searchTerm || 
      circular.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circular.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circular.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || circular.status === filterStatus
    const matchesCategory = filterCategory === 'all' || circular.category === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = [...new Set(mockCirculars.map(c => c.category))]

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Regulatory Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor RBI circulars, compliance status, and regulatory updates
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Link href="/dashboard/regulatory/impact-analysis">
              <Button variant="outline">
                Impact Analysis
              </Button>
            </Link>
            <Link href="/dashboard/regulatory/compliance-tracker">
              <Button variant="primary">
                Compliance Tracker
              </Button>
            </Link>
          </div>
        </div>

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
                    <dd className="text-lg font-medium text-gray-900">{mockCirculars.length}</dd>
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
                    <dd className="text-lg font-medium text-gray-900">
                      {mockCirculars.filter(c => c.status === 'pending').length}
                    </dd>
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
                    <dd className="text-lg font-medium text-gray-900">
                      {mockCirculars.filter(c => c.status === 'compliant').length}
                    </dd>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">High Priority</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {mockCirculars.filter(c => c.priority === 'high').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search circulars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <Button variant="outline" className="flex items-center">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Circulars List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">RBI Circulars</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredCirculars.length} of {mockCirculars.length} circulars
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCirculars.map((circular) => (
                <div key={circular.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(circular.status)}
                        <Link 
                          href={`/dashboard/regulatory/circulars/${circular.id}`}
                          className="text-lg font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {circular.title}
                        </Link>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-medium">{circular.id}</span>
                        <span>•</span>
                        <span>{circular.category}</span>
                        <span>•</span>
                        <span>Issued: {new Date(circular.issuedDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Effective: {new Date(circular.effectiveDate).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-600">{circular.description}</p>
                      
                      <div className="mt-3 flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(circular.status)}`}>
                          {circular.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(circular.priority)}`}>
                          {circular.priority} Priority
                        </span>
                        <span className="text-xs text-gray-500">
                          Compliance Deadline: {new Date(circular.complianceDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex-shrink-0">
                      <Link href={`/dashboard/regulatory/circulars/${circular.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredCirculars.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No circulars found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
