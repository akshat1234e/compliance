'use client'

import { useState } from 'react'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface WorkflowStep {
  id: string
  type: 'start' | 'task' | 'decision' | 'end'
  title: string
  description: string
  assignee?: string
}

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: '1', type: 'start', title: 'Start', description: 'Workflow begins' },
    { id: '2', type: 'end', title: 'End', description: 'Workflow ends' }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStep = (type: 'task' | 'decision') => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      description: 'Enter description',
      assignee: ''
    }
    setSteps(prev => [...prev.slice(0, -1), newStep, prev[prev.length - 1]])
  }

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(step => step.id !== id))
  }

  const updateStep = (id: string, field: keyof WorkflowStep, value: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ))
  }

  const handleSave = async () => {
    // Validate workflow has meaningful steps
    const hasSteps = steps.some(s => s.type === 'task' || s.type === 'decision')
    if (!hasSteps) {
      setError('Workflow must have at least one task or decision step')
      return
    }

    setIsSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workflowName, description: workflowDescription, steps })
      })
      
      if (!response.ok) throw new Error('Failed to save workflow')
      
      router.push('/dashboard/workflows')
    } catch (error) {
      console.error('Error saving workflow:', error)
      setError(error instanceof Error ? error.message : 'Failed to save workflow')
    } finally {
      setIsSaving(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Create Workflow</h1>
          <p className="text-sm text-gray-500">Design a new compliance workflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Workflow Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe the workflow purpose"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => addStep('task')}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Task
              </button>
              <button
                onClick={() => addStep('decision')}
                className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Decision
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Workflow Steps</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Step {index + 1} - {step.type}
                  </span>
                  {step.type !== 'start' && step.type !== 'end' && (
                    <button
                      onClick={() => removeStep(step.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2"
                  disabled={step.type === 'start' || step.type === 'end'}
                />
                <input
                  type="text"
                  value={step.description}
                  onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  disabled={step.type === 'start' || step.type === 'end'}
                />
                {(step.type === 'task' || step.type === 'decision') && (
                  <input
                    type="text"
                    value={step.assignee || ''}
                    onChange={(e) => updateStep(step.id, 'assignee', e.target.value)}
                    placeholder="Assignee email"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !workflowName}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </button>
      </div>
    </div>
  )
}