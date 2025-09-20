'use client'

import { useState } from 'react'
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function ActiveWorkflowsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const activeWorkflows = [
    { id: 1, name: 'RBI Circular Review', status: 'Running', progress: 37 },
    { id: 2, name: 'KYC Verification', status: 'Running', progress: 62 }
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
          <h1 className="text-2xl font-bold text-gray-900">Active Workflows</h1>
          <p className="text-sm text-gray-500">Currently running workflow instances</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Running Workflows ({activeWorkflows.length})</h3>
            <div className="space-y-4">
              {activeWorkflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PlayIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">{workflow.name}</h4>
                      <p className="text-sm text-gray-500">{workflow.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{workflow.progress}%</div>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}