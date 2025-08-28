'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface WorkflowNode {
  id: string
  type: 'start' | 'task' | 'decision' | 'end'
  title: string
  description: string
  x: number
  y: number
}

export function WorkflowBuilder() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'start', title: 'Start', description: 'Workflow begins', x: 100, y: 100 },
    { id: '2', type: 'task', title: 'Review Document', description: 'Manual review required', x: 300, y: 100 },
    { id: '3', type: 'decision', title: 'Approved?', description: 'Decision point', x: 500, y: 100 },
    { id: '4', type: 'end', title: 'Complete', description: 'Workflow ends', x: 700, y: 100 }
  ])

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      description: 'Description',
      x: Math.random() * 400 + 100,
      y: Math.random() * 200 + 100
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id))
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-100 border-green-300'
      case 'task': return 'bg-blue-100 border-blue-300'
      case 'decision': return 'bg-yellow-100 border-yellow-300'
      case 'end': return 'bg-red-100 border-red-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Workflow Builder</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => addNode('task')}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Task
          </button>
          <button
            onClick={() => addNode('decision')}
            className="flex items-center px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Decision
          </button>
        </div>
      </div>

      <div className="relative h-96 bg-gray-50 rounded border overflow-auto">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute w-32 h-16 rounded border-2 p-2 cursor-move ${getNodeColor(node.type)}`}
            style={{ left: node.x, top: node.y }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs font-medium truncate">{node.title}</div>
                <div className="text-xs text-gray-600 truncate">{node.description}</div>
              </div>
              {node.type !== 'start' && node.type !== 'end' && (
                <button
                  onClick={() => removeNode(node.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <button className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
          Cancel
        </button>
        <button className="px-4 py-2 text-sm bg-brand-600 text-white rounded hover:bg-brand-700">
          Save Workflow
        </button>
      </div>
    </div>
  )
}