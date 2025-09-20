'use client'

import { useState } from 'react'
import { ArrowLeftIcon, PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useRouter, useParams } from 'next/navigation'

export default function WorkflowDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)

  const workflowId = params.id
  const workflowName = workflowId === '1' ? 'RBI Circular Review Process' : 
                      workflowId === '2' ? 'KYC Document Verification' : 
                      'Risk Assessment Workflow'

  const steps = [
    { id: 1, name: 'Circular Detection', status: 'completed', duration: '2 min' },
    { id: 2, name: 'AI Analysis', status: 'completed', duration: '15 min' },
    { id: 3, name: 'Compliance Review', status: 'in-progress', duration: '45 min' },
    { id: 4, name: 'Management Approval', status: 'pending', duration: '30 min' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workflowName}</h1>
          <p className="text-sm text-gray-500">Workflow ID: {workflowId}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Workflow Steps</h3>
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center space-x-3">
                  {step.status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : step.status === 'in-progress' ? (
                    <div className="h-5 w-5 border-2 border-blue-500 rounded-full animate-spin" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-gray-500">Duration: {step.duration}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Success Rate</div>
                <div className="text-2xl font-bold text-green-600">92%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Average Duration</div>
                <div className="text-2xl font-bold text-blue-600">2.5 hours</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Runs</div>
                <div className="text-2xl font-bold text-gray-900">47</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}