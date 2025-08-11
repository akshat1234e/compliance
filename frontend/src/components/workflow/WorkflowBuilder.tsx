/**
 * WorkflowBuilder Component
 * Visual workflow builder with drag-and-drop interface for creating compliance workflows
 */

import {
    Badge,
    Button,
    Input,
    LoadingSpinner,
    Modal
} from '@/components/ui';
import { cn } from '@/lib/utils';
import React from 'react';

// Types
export interface WorkflowNode {
  id: string
  type: 'start' | 'task' | 'approval' | 'condition' | 'notification' | 'end'
  title: string
  description: string
  position: { x: number; y: number }
  data: {
    assignee?: string
    role?: string
    dueDate?: string
    priority?: 'low' | 'medium' | 'high' | 'critical'
    conditions?: Array<{
      field: string
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
      value: string
    }>
    notifications?: Array<{
      type: 'email' | 'sms' | 'in_app'
      recipients: string[]
      template: string
    }>
    formFields?: Array<{
      id: string
      label: string
      type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file'
      required: boolean
      options?: string[]
    }>
  }
  connections: Array<{
    targetNodeId: string
    condition?: string
    label?: string
  }>
}

export interface Workflow {
  id: string
  name: string
  description: string
  category: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  version: string
  createdBy: string
  createdDate: string
  lastModifiedBy: string
  lastModifiedDate: string
  nodes: WorkflowNode[]
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event' | 'regulatory_change'
    config: any
  }>
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'date'
    defaultValue?: any
    description: string
  }>
  permissions: Array<{
    role: string
    actions: string[]
  }>
}

export interface WorkflowBuilderProps {
  workflow?: Workflow
  loading?: boolean
  onSave?: (workflow: Workflow) => void
  onPublish?: (workflowId: string) => void
  onTest?: (workflow: Workflow) => void
  onCancel?: () => void
  readOnly?: boolean
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflow,
  loading = false,
  onSave,
  onPublish,
  onTest,
  onCancel,
  readOnly = false
}) => {
  const [currentWorkflow, setCurrentWorkflow] = React.useState<Workflow>(
    workflow || {
      id: '',
      name: 'New Workflow',
      description: '',
      category: 'compliance',
      status: 'draft',
      version: '1.0',
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      lastModifiedBy: 'Current User',
      lastModifiedDate: new Date().toISOString(),
      nodes: [],
      triggers: [],
      variables: [],
      permissions: []
    }
  )

  const [selectedNode, setSelectedNode] = React.useState<WorkflowNode | null>(null)
  const [showNodeEditor, setShowNodeEditor] = React.useState(false)
  const [draggedNodeType, setDraggedNodeType] = React.useState<string | null>(null)
  const [canvasOffset, setCanvasOffset] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)

  // Node types available in the palette
  const nodeTypes = [
    {
      type: 'start',
      title: 'Start',
      icon: '🚀',
      description: 'Workflow start point',
      color: 'bg-success-100 border-success-300'
    },
    {
      type: 'task',
      title: 'Task',
      icon: '📋',
      description: 'Manual task assignment',
      color: 'bg-blue-100 border-blue-300'
    },
    {
      type: 'approval',
      title: 'Approval',
      icon: '✅',
      description: 'Approval step',
      color: 'bg-warning-100 border-warning-300'
    },
    {
      type: 'condition',
      title: 'Condition',
      icon: '🔀',
      description: 'Conditional branching',
      color: 'bg-purple-100 border-purple-300'
    },
    {
      type: 'notification',
      title: 'Notification',
      icon: '📧',
      description: 'Send notification',
      color: 'bg-orange-100 border-orange-300'
    },
    {
      type: 'end',
      title: 'End',
      icon: '🏁',
      description: 'Workflow end point',
      color: 'bg-error-100 border-error-300'
    }
  ]

  const handleNodeDragStart = (nodeType: string) => {
    setDraggedNodeType(nodeType)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedNodeType) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType as any,
      title: nodeTypes.find(nt => nt.type === draggedNodeType)?.title || 'New Node',
      description: '',
      position: { x, y },
      data: {},
      connections: []
    }

    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }))

    setDraggedNodeType(null)
  }

  const handleNodeClick = (node: WorkflowNode) => {
    if (readOnly) return
    setSelectedNode(node)
    setShowNodeEditor(true)
  }

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === updatedNode.id ? updatedNode : node
      )
    }))
    setShowNodeEditor(false)
    setSelectedNode(null)
  }

  const handleNodeDelete = (nodeId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId)
    }))
    setShowNodeEditor(false)
    setSelectedNode(null)
  }

  const handleSave = () => {
    onSave?.(currentWorkflow)
  }

  const handleTest = () => {
    onTest?.(currentWorkflow)
  }

  const handlePublish = () => {
    if (currentWorkflow.id) {
      onPublish?.(currentWorkflow.id)
    }
  }

  const getNodeTypeConfig = (type: string) => {
    return nodeTypes.find(nt => nt.type === type) || nodeTypes[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {currentWorkflow.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  v{currentWorkflow.version}
                </Badge>
                <Badge
                  variant={
                    currentWorkflow.status === 'active' ? 'success' :
                    currentWorkflow.status === 'draft' ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {currentWorkflow.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {currentWorkflow.nodes.length} nodes
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={handleTest}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1M9 6h1m4 0h1" />
                  </svg>
                  Test
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </Button>
                {currentWorkflow.status === 'draft' && (
                  <Button size="sm" onClick={handlePublish}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Publish
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={onCancel}>
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        {!readOnly && (
          <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">Workflow Components</h3>
            <div className="space-y-2">
              {nodeTypes.map((nodeType) => (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={() => handleNodeDragStart(nodeType.type)}
                  className={cn(
                    'p-3 rounded-lg border-2 border-dashed cursor-move hover:shadow-md transition-all',
                    nodeType.color
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{nodeType.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{nodeType.title}</div>
                      <div className="text-xs text-gray-600">{nodeType.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Workflow Properties */}
            <div className="mt-8">
              <h3 className="font-medium text-gray-900 mb-4">Workflow Properties</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    value={currentWorkflow.name}
                    onChange={(e) => setCurrentWorkflow(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={currentWorkflow.description}
                    onChange={(e) => setCurrentWorkflow(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    className="w-full text-sm border rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={currentWorkflow.category}
                    onChange={(e) => setCurrentWorkflow(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                    className="w-full text-sm border rounded-md px-3 py-2"
                  >
                    <option value="compliance">Compliance</option>
                    <option value="risk">Risk Management</option>
                    <option value="audit">Audit</option>
                    <option value="operations">Operations</option>
                    <option value="regulatory">Regulatory</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="w-full h-full bg-gray-100 relative"
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
          >
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </Button>
              <span className="text-sm font-medium px-2">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Button>
            </div>

            {/* Workflow Nodes */}
            <div
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {currentWorkflow.nodes.map((node) => {
                const nodeConfig = getNodeTypeConfig(node.type)
                return (
                  <div
                    key={node.id}
                    className={cn(
                      'absolute w-48 p-4 rounded-lg border-2 bg-white shadow-md cursor-pointer hover:shadow-lg transition-all',
                      nodeConfig.color,
                      selectedNode?.id === node.id && 'ring-2 ring-brand-500'
                    )}
                    style={{
                      left: node.position.x,
                      top: node.position.y
                    }}
                    onClick={() => handleNodeClick(node)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{nodeConfig.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{node.title}</div>
                        <div className="text-xs text-gray-600">{nodeConfig.title}</div>
                      </div>
                    </div>
                    {node.description && (
                      <div className="text-xs text-gray-600 mt-2">
                        {node.description}
                      </div>
                    )}
                    {node.data.assignee && (
                      <div className="text-xs text-gray-600 mt-2">
                        Assigned to: {node.data.assignee}
                      </div>
                    )}
                    {node.connections.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {node.connections.length} connection(s)
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                {currentWorkflow.nodes.map((node) =>
                  node.connections.map((connection, index) => {
                    const targetNode = currentWorkflow.nodes.find(n => n.id === connection.targetNodeId)
                    if (!targetNode) return null

                    const startX = node.position.x + 96 // Half of node width
                    const startY = node.position.y + 40 // Approximate center
                    const endX = targetNode.position.x + 96
                    const endY = targetNode.position.y + 40

                    return (
                      <g key={`${node.id}-${connection.targetNodeId}-${index}`}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#6b7280"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                        {connection.label && (
                          <text
                            x={(startX + endX) / 2}
                            y={(startY + endY) / 2 - 5}
                            textAnchor="middle"
                            className="text-xs fill-gray-600"
                          >
                            {connection.label}
                          </text>
                        )}
                      </g>
                    )
                  })
                )}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>
              </svg>
            </div>

            {/* Empty State */}
            {currentWorkflow.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Start Building Your Workflow
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag components from the palette to create your compliance workflow
                  </p>
                  {!readOnly && (
                    <div className="text-sm text-gray-500">
                      Start with a "Start" node and build your process step by step
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Editor Modal */}
      {showNodeEditor && selectedNode && (
        <Modal
          open={showNodeEditor}
          onClose={() => setShowNodeEditor(false)}
          title={`Edit ${getNodeTypeConfig(selectedNode.type).title} Node`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={selectedNode.title}
                onChange={(e) => setSelectedNode(prev => prev ? {
                  ...prev,
                  title: e.target.value
                } : null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={selectedNode.description}
                onChange={(e) => setSelectedNode(prev => prev ? {
                  ...prev,
                  description: e.target.value
                } : null)}
                className="w-full border rounded-md px-3 py-2"
                rows={3}
              />
            </div>

            {(selectedNode.type === 'task' || selectedNode.type === 'approval') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <Input
                    value={selectedNode.data.assignee || ''}
                    onChange={(e) => setSelectedNode(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, assignee: e.target.value }
                    } : null)}
                    placeholder="Enter assignee name or role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedNode.data.priority || 'medium'}
                    onChange={(e) => setSelectedNode(prev => prev ? {
                      ...prev,
                      data: { ...prev.data, priority: e.target.value as any }
                    } : null)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={() => handleNodeDelete(selectedNode.id)}
              >
                Delete Node
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNodeEditor(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedNode && handleNodeUpdate(selectedNode)}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default WorkflowBuilder
