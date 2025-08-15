'use client'

import { useState } from 'react'
import { 
  BellIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const circulars = [
  {
    id: 1,
    number: 'DBOD.No.123/2024',
    title: 'Guidelines on Digital Lending Platforms',
    date: '2024-03-20',
    effectiveDate: '2024-04-01',
    category: 'Digital Banking',
    impact: 'high',
    status: 'new',
    summary: 'New guidelines for digital lending platforms and third-party partnerships'
  },
  {
    id: 2,
    number: 'DPSS.CO.PD.No.456/2024',
    title: 'Updated KYC Norms for Payment Banks',
    date: '2024-03-18',
    effectiveDate: '2024-03-25',
    category: 'KYC/AML',
    impact: 'medium',
    status: 'reviewed',
    summary: 'Enhanced customer verification requirements for payment banking services'
  },
  {
    id: 3,
    number: 'RBI/2024-25/789',
    title: 'Cyber Security Framework Updates',
    date: '2024-03-15',
    effectiveDate: '2024-04-15',
    category: 'Cyber Security',
    impact: 'high',
    status: 'implemented',
    summary: 'Updated cybersecurity guidelines and incident reporting requirements'
  },
]

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-red-100 text-red-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'low': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new': return <BellIcon className="h-4 w-4 text-blue-500" />
    case 'reviewed': return <ClockIcon className="h-4 w-4 text-yellow-500" />
    case 'implemented': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    default: return <DocumentTextIcon className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700'
    case 'reviewed': return 'bg-yellow-100 text-yellow-700'
    case 'implemented': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function RegulatoryPage() {
  const [filter, setFilter] = useState('all')

  const filteredCirculars = circulars.filter(circular => 
    filter === 'all' || circular.status === filter
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regulatory Intelligence</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor RBI circulars and regulatory updates
          </p>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
          Sync Updates
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Circulars</p>
              <p className="text-2xl font-bold text-gray-900">
                {circulars.filter(c => c.status === 'new').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {circulars.filter(c => c.status === 'reviewed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Implemented</p>
              <p className="text-2xl font-bold text-gray-900">
                {circulars.filter(c => c.status === 'implemented').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Impact</p>
              <p className="text-2xl font-bold text-gray-900">
                {circulars.filter(c => c.impact === 'high').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        {['all', 'new', 'reviewed', 'implemented'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-brand-100 text-brand-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">RBI Circulars</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredCirculars.map((circular) => (
            <div key={circular.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(circular.status)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{circular.title}</h4>
                      <p className="text-sm text-gray-500">{circular.number}</p>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600">{circular.summary}</p>
                  
                  <div className="mt-4 flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Published:</span>
                      <span className="text-xs font-medium text-gray-900">{circular.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Effective:</span>
                      <span className="text-xs font-medium text-gray-900">{circular.effectiveDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Category:</span>
                      <span className="text-xs font-medium text-gray-900">{circular.category}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(circular.status)}`}>
                      {circular.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactColor(circular.impact)}`}>
                      {circular.impact} impact
                    </span>
                  </div>
                </div>
                
                <div className="ml-4 flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}