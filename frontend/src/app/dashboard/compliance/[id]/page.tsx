'use client'

import { useState, useEffect } from 'react'
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useRouter, useParams } from 'next/navigation'

export default function ComplianceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [item, setItem] = useState(null)

  const complianceId = params.id

  useEffect(() => {
    const fetchComplianceItem = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/compliance/${complianceId}`)
        if (response.ok) {
          const data = await response.json()
          setItem(data)
        } else {
          setItem(null)
        }
      } catch (error) {
        console.error('Failed to fetch compliance item:', error)
        setItem(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (complianceId) {
      fetchComplianceItem()
    }
  }, [complianceId])

  const tasks = [
    { id: 1, name: 'Review Guidelines', status: 'completed' },
    { id: 2, name: 'Update Policies', status: 'completed' },
    { id: 3, name: 'Staff Training', status: 'in-progress' },
    { id: 4, name: 'System Implementation', status: 'pending' },
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
          <h1 className="text-2xl font-bold text-gray-900">{item?.title}</h1>
          <p className="text-sm text-gray-500">Compliance Requirement Details</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : !item ? (
        <div className="text-center p-8">
          <p className="text-gray-500">Compliance item not found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Completion</span>
                <span>{item?.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-brand-600 h-3 rounded-full transition-all"
                  style={{ width: `${item?.progress}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  {task.status === 'completed' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : task.status === 'in-progress' ? (
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}
                  <span className={task.status === 'completed' ? 'line-through text-gray-500' : ''}>
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Requirement Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  item?.status === 'compliant' ? 'bg-green-100 text-green-700' :
                  item?.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  item?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item?.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Due Date</div>
                <div className="font-medium">{item?.dueDate || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Priority</div>
                <div className="font-medium">{item?.priority || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}