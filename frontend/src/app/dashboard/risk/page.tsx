'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ExclamationTriangleIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'

const riskMetrics = [
  { name: 'Overall Risk Score', value: '7.2', max: '10', status: 'medium', trend: 'down' },
  { name: 'Operational Risk', value: '6.8', max: '10', status: 'medium', trend: 'stable' },
  { name: 'Compliance Risk', value: '3.2', max: '10', status: 'low', trend: 'down' },
  { name: 'Cyber Security Risk', value: '8.1', max: '10', status: 'high', trend: 'up' },
]

const riskItems = [
  {
    id: 1,
    title: 'Flexcube Connection Failure',
    description: 'Banking system connector experiencing intermittent failures',
    severity: 'high',
    category: 'Operational',
    impact: 'Service disruption for loan processing',
    mitigation: 'Implement redundant connection paths',
    owner: 'IT Operations',
    dueDate: '2024-03-25'
  },
  {
    id: 2,
    title: 'Outdated Security Certificates',
    description: 'SSL certificates for external APIs expiring soon',
    severity: 'medium',
    category: 'Security',
    impact: 'Potential service interruption',
    mitigation: 'Schedule certificate renewal',
    owner: 'Security Team',
    dueDate: '2024-04-01'
  },
  {
    id: 3,
    title: 'Incomplete KYC Documentation',
    description: 'Missing customer verification documents',
    severity: 'medium',
    category: 'Compliance',
    impact: 'Regulatory non-compliance risk',
    mitigation: 'Automated document collection system',
    owner: 'Compliance Team',
    dueDate: '2024-03-30'
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'low': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'high': return 'text-red-600'
    case 'medium': return 'text-yellow-600'
    case 'low': return 'text-green-600'
    default: return 'text-gray-600'
  }
}

export default function RiskPage() {
  const router = useRouter()
  const [selectedRisk, setSelectedRisk] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const riskCategories = [
    'Operational', 'Compliance', 'Security', 'Financial', 'Strategic'
  ]

  const riskDataCache = useMemo(() => {
    let seed = 12345
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    return Array.from({ length: 25 }, (_, index) => {
      const category = riskCategories[Math.floor(index / 5)]
      const intensity = seededRandom()
      return {
        id: index,
        category,
        score: (intensity * 10).toFixed(1),
        level: intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low',
        trend: seededRandom() > 0.5 ? 'up' : 'down',
        lastUpdated: '2 hours ago'
      }
    })
  }, [])

  const openRiskDetail = (riskData: any) => {
    setSelectedRisk(riskData)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedRisk(null)
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage operational and compliance risks
          </p>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
          Run Assessment
        </button>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {riskMetrics.map((metric) => (
          <div key={metric.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <div className="flex items-baseline space-x-1">
                  <p className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {metric.value}
                  </p>
                  <p className="text-sm text-gray-500">/ {metric.max}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(metric.status)}`}>
                  {metric.status}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} {metric.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Heatmap */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Heatmap</h3>
        <div className="grid grid-cols-5 gap-2">
          {riskDataCache.map((riskData) => (
            <div
              key={riskData.id}
              onClick={() => openRiskDetail(riskData)}
              className={`h-8 rounded cursor-pointer hover:scale-105 transition-transform ${
                riskData.level === 'high' ? 'bg-red-500' :
                riskData.level === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              title={`${riskData.category}: ${riskData.score}/10`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Risk Detail Modal */}
      {isModalOpen && selectedRisk && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className="text-lg font-semibold">{selectedRisk.category} Risk Analysis</h3>
              <button 
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Current Score</div>
                <div className={`text-2xl font-bold ${
                  selectedRisk.level === 'high' ? 'text-red-600' :
                  selectedRisk.level === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {selectedRisk.score}/10
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Trend</div>
                <div className="font-medium">
                  {selectedRisk.trend === 'up' ? '↗ Increasing' : '↘ Decreasing'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="font-medium">{selectedRisk.lastUpdated}</div>
              </div>
              <button 
                onClick={() => router.push(`/dashboard/risk/${selectedRisk.category.toLowerCase()}`)}
                className="w-full mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                autoFocus
              >
                View Detailed Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Risk Items</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {riskItems.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <ExclamationTriangleIcon className={`h-5 w-5 ${
                      item.severity === 'high' ? 'text-red-500' :
                      item.severity === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-xs text-gray-500">Severity</span>
                      <div className={`mt-1 px-2 py-1 text-xs font-medium rounded ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Category</span>
                      <p className="mt-1 text-xs font-medium text-gray-900">{item.category}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Owner</span>
                      <p className="mt-1 text-xs font-medium text-gray-900">{item.owner}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Due Date</span>
                      <p className="mt-1 text-xs font-medium text-gray-900">{item.dueDate}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-xs text-gray-500 mb-1">Impact</div>
                    <p className="text-sm text-gray-700">{item.impact}</p>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Mitigation</div>
                    <p className="text-sm text-gray-700">{item.mitigation}</p>
                  </div>
                </div>
                
                <button className="ml-4 text-brand-600 hover:text-brand-700 text-sm font-medium">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}