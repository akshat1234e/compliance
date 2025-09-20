'use client'

import { useState } from 'react'
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function WorkflowInstancesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
          <h1 className="text-2xl font-bold text-gray-900">Workflow Instances</h1>
          <p className="text-sm text-gray-500">Monitor all running workflow instances</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ClockIcon className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Running Instances (20)</h3>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p>Detailed instance monitoring coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}