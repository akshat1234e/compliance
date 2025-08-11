/**
 * Workflow Management Interface Example
 * Demonstrates how to use the workflow management system
 */

import React from 'react';
import { WorkflowManagementInterface } from '../index';

// Example user data
const exampleUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@company.com',
  role: 'Compliance Manager',
  permissions: [
    'workflow:create',
    'workflow:edit',
    'workflow:delete',
    'workflow:view',
    'task:assign',
    'task:update',
    'task:view',
    'analytics:view'
  ]
};

const WorkflowManagementExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enterprise RBI Compliance Management
          </h1>
          <p className="text-gray-600">
            Comprehensive workflow management for regulatory compliance
          </p>
        </div>

        {/* Main Workflow Management Interface */}
        <WorkflowManagementInterface
          organizationId="org-123"
          currentUser={exampleUser}
        />
      </div>
    </div>
  );
};

export default WorkflowManagementExample;

// Example of using individual components
export const IndividualComponentsExample: React.FC = () => {
  const {
    WorkflowBuilder,
    TaskManagement,
    WorkflowTemplates,
    WorkflowAnalytics
  } = require('../index');

  const [activeComponent, setActiveComponent] = React.useState<string>('builder');

  const mockWorkflow = {
    id: 'wf-001',
    name: 'RBI Circular Review',
    description: 'Standard process for reviewing RBI circulars',
    category: 'compliance',
    status: 'draft' as const,
    version: '1.0',
    createdBy: 'user-123',
    createdDate: new Date().toISOString(),
    lastModifiedBy: 'user-123',
    lastModifiedDate: new Date().toISOString(),
    nodes: [
      {
        id: 'start',
        type: 'start' as const,
        title: 'Start',
        description: 'Workflow start point',
        position: { x: 100, y: 100 },
        data: {},
        connections: [{ targetNodeId: 'review', label: 'Begin' }]
      },
      {
        id: 'review',
        type: 'task' as const,
        title: 'Initial Review',
        description: 'Review the RBI circular',
        position: { x: 300, y: 100 },
        data: {
          assignee: 'Compliance Team',
          priority: 'high' as const,
          estimatedHours: 4
        },
        connections: [{ targetNodeId: 'end', label: 'Complete' }]
      },
      {
        id: 'end',
        type: 'end' as const,
        title: 'End',
        description: 'Workflow end point',
        position: { x: 500, y: 100 },
        data: {},
        connections: []
      }
    ],
    triggers: [],
    variables: [],
    permissions: []
  };

  const mockTasks = [
    {
      id: 'task-001',
      title: 'Review RBI Circular RBI/2024/123',
      description: 'Analyze the new RBI circular for compliance requirements',
      status: 'pending' as const,
      priority: 'high' as const,
      assignedTo: {
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        avatar: '/avatars/jane.jpg'
      },
      dueDate: '2024-03-20',
      estimatedHours: 4,
      actualHours: 0,
      progress: 0,
      workflowId: 'wf-001',
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: '2024-03-15T10:00:00Z',
      tags: ['rbi', 'circular', 'review'],
      attachments: []
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Individual Components Example
          </h1>
          <p className="text-gray-600">
            Demonstrating individual workflow components
          </p>
        </div>

        {/* Component Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveComponent('builder')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === 'builder'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Workflow Builder
            </button>
            <button
              onClick={() => setActiveComponent('tasks')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === 'tasks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Task Management
            </button>
            <button
              onClick={() => setActiveComponent('templates')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveComponent('analytics')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeComponent === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Component Display */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeComponent === 'builder' && (
            <WorkflowBuilder
              workflow={mockWorkflow}
              onSave={(workflow) => {
                console.log('Saving workflow:', workflow);
                alert('Workflow saved successfully!');
              }}
              onPublish={(workflowId) => {
                console.log('Publishing workflow:', workflowId);
                alert('Workflow published successfully!');
              }}
              onTest={(workflow) => {
                console.log('Testing workflow:', workflow);
                alert('Workflow test completed!');
              }}
              onCancel={() => {
                console.log('Workflow builder cancelled');
                alert('Workflow builder cancelled');
              }}
            />
          )}

          {activeComponent === 'tasks' && (
            <TaskManagement
              tasks={mockTasks}
              currentUser={exampleUser}
              onTaskUpdate={(taskId, updates) => {
                console.log('Updating task:', taskId, updates);
                alert(`Task ${taskId} updated successfully!`);
              }}
            />
          )}

          {activeComponent === 'templates' && (
            <WorkflowTemplates
              onCreateFromTemplate={(template) => {
                console.log('Creating workflow from template:', template);
                alert(`Creating workflow from template: ${template.name}`);
              }}
            />
          )}

          {activeComponent === 'analytics' && (
            <WorkflowAnalytics
              workflows={[mockWorkflow]}
              tasks={mockTasks}
              dateRange={{
                start: '2024-01-01',
                end: '2024-03-31'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Example of custom workflow configuration
export const CustomWorkflowExample: React.FC = () => {
  const customWorkflow = {
    id: 'custom-wf-001',
    name: 'Custom Audit Process',
    description: 'Customized audit workflow with specific requirements',
    category: 'audit',
    status: 'draft' as const,
    version: '1.0',
    createdBy: 'user-123',
    createdDate: new Date().toISOString(),
    lastModifiedBy: 'user-123',
    lastModifiedDate: new Date().toISOString(),
    nodes: [
      {
        id: 'start',
        type: 'start' as const,
        title: 'Audit Initiation',
        description: 'Start the audit process',
        position: { x: 50, y: 100 },
        data: {},
        connections: [{ targetNodeId: 'planning', label: 'Initiate' }]
      },
      {
        id: 'planning',
        type: 'task' as const,
        title: 'Audit Planning',
        description: 'Plan the audit scope and methodology',
        position: { x: 250, y: 100 },
        data: {
          assignee: 'Audit Manager',
          priority: 'high' as const,
          estimatedHours: 8,
          requiredSkills: ['audit', 'planning', 'risk-assessment']
        },
        connections: [{ targetNodeId: 'approval', label: 'Plan Ready' }]
      },
      {
        id: 'approval',
        type: 'approval' as const,
        title: 'Plan Approval',
        description: 'Approve the audit plan',
        position: { x: 450, y: 100 },
        data: {
          approvers: ['Chief Audit Executive', 'Risk Manager'],
          approvalType: 'all' as const,
          escalationHours: 24
        },
        connections: [
          { targetNodeId: 'execution', label: 'Approved' },
          { targetNodeId: 'planning', label: 'Rejected' }
        ]
      },
      {
        id: 'execution',
        type: 'task' as const,
        title: 'Audit Execution',
        description: 'Execute the audit procedures',
        position: { x: 650, y: 100 },
        data: {
          assignee: 'Audit Team',
          priority: 'medium' as const,
          estimatedHours: 40,
          parallelExecution: true
        },
        connections: [{ targetNodeId: 'reporting', label: 'Complete' }]
      },
      {
        id: 'reporting',
        type: 'task' as const,
        title: 'Audit Reporting',
        description: 'Prepare audit report',
        position: { x: 850, y: 100 },
        data: {
          assignee: 'Senior Auditor',
          priority: 'high' as const,
          estimatedHours: 16,
          deliverables: ['audit-report', 'management-letter']
        },
        connections: [{ targetNodeId: 'end', label: 'Report Ready' }]
      },
      {
        id: 'end',
        type: 'end' as const,
        title: 'Audit Complete',
        description: 'Audit process completed',
        position: { x: 1050, y: 100 },
        data: {},
        connections: []
      }
    ],
    triggers: [
      {
        type: 'scheduled',
        schedule: '0 0 1 */3 *', // Quarterly
        enabled: true
      },
      {
        type: 'event',
        eventType: 'risk_threshold_exceeded',
        enabled: true
      }
    ],
    variables: [
      {
        name: 'audit_scope',
        type: 'string',
        required: true,
        description: 'Scope of the audit'
      },
      {
        name: 'risk_rating',
        type: 'number',
        required: true,
        description: 'Risk rating of the audit area'
      }
    ],
    permissions: [
      {
        role: 'audit_manager',
        actions: ['read', 'write', 'execute']
      },
      {
        role: 'auditor',
        actions: ['read', 'execute']
      }
    ]
  };

  const { WorkflowBuilder } = require('../index');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Custom Workflow Example
          </h1>
          <p className="text-gray-600">
            Advanced audit workflow with custom configurations
          </p>
        </div>

        <WorkflowBuilder
          workflow={customWorkflow}
          onSave={(workflow) => {
            console.log('Saving custom workflow:', workflow);
            // Here you would typically send to your API
          }}
          onPublish={(workflowId) => {
            console.log('Publishing custom workflow:', workflowId);
            // Here you would typically call your publish API
          }}
          onTest={(workflow) => {
            console.log('Testing custom workflow:', workflow);
            // Here you would typically run workflow validation
          }}
          onCancel={() => {
            console.log('Custom workflow builder cancelled');
          }}
        />
      </div>
    </div>
  );
};
