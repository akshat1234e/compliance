/**
 * Workflow Management Interface
 * Main interface for managing workflows, tasks, and approvals
 */

import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    LoadingSpinner,
    Table
} from '@/components/ui';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import TaskManagement from './TaskManagement';
import WorkflowAnalytics from './WorkflowAnalytics';
import WorkflowBuilder from './WorkflowBuilder';
import WorkflowTemplates from './WorkflowTemplates';

// Types
export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: string;
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  averageCompletionTime: number;
  createdBy: string;
  createdDate: string;
  lastModifiedDate: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  workflowName: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  createdDate: string;
}

export interface WorkflowManagementProps {
  organizationId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

const WorkflowManagementInterface: React.FC<WorkflowManagementProps> = ({
  organizationId,
  currentUser
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'tasks' | 'templates' | 'analytics'>('overview');
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Mock data - In real implementation, this would come from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock workflows data
      setWorkflows([
        {
          id: 'wf-001',
          name: 'RBI Circular Review Process',
          description: 'Standard process for reviewing and implementing RBI circulars',
          category: 'regulatory',
          status: 'active',
          version: '2.1',
          totalInstances: 45,
          activeInstances: 12,
          completedInstances: 33,
          averageCompletionTime: 72,
          createdBy: 'System Admin',
          createdDate: '2024-01-15',
          lastModifiedDate: '2024-02-20'
        },
        {
          id: 'wf-002',
          name: 'Compliance Assessment Workflow',
          description: 'Comprehensive compliance assessment for new regulations',
          category: 'compliance',
          status: 'active',
          version: '1.5',
          totalInstances: 28,
          activeInstances: 8,
          completedInstances: 20,
          averageCompletionTime: 96,
          createdBy: 'Compliance Manager',
          createdDate: '2024-02-01',
          lastModifiedDate: '2024-03-10'
        },
        {
          id: 'wf-003',
          name: 'Document Approval Process',
          description: 'Multi-level approval process for compliance documents',
          category: 'approval',
          status: 'active',
          version: '1.0',
          totalInstances: 67,
          activeInstances: 15,
          completedInstances: 52,
          averageCompletionTime: 48,
          createdBy: 'Document Manager',
          createdDate: '2024-01-20',
          lastModifiedDate: '2024-03-05'
        }
      ]);

      // Mock tasks data
      setTasks([
        {
          id: 'task-001',
          title: 'Review RBI Circular DBOD.No.123/2024',
          workflowName: 'RBI Circular Review Process',
          assignedTo: 'John Smith',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2024-03-25',
          createdDate: '2024-03-20'
        },
        {
          id: 'task-002',
          title: 'Assess Impact of New KYC Guidelines',
          workflowName: 'Compliance Assessment Workflow',
          assignedTo: 'Sarah Johnson',
          status: 'pending',
          priority: 'critical',
          dueDate: '2024-03-22',
          createdDate: '2024-03-18'
        },
        {
          id: 'task-003',
          title: 'Approve Risk Management Policy Update',
          workflowName: 'Document Approval Process',
          assignedTo: 'Mike Wilson',
          status: 'overdue',
          priority: 'high',
          dueDate: '2024-03-20',
          createdDate: '2024-03-15'
        },
        {
          id: 'task-004',
          title: 'Validate Compliance Checklist',
          workflowName: 'Compliance Assessment Workflow',
          assignedTo: 'Emily Davis',
          status: 'completed',
          priority: 'medium',
          dueDate: '2024-03-18',
          createdDate: '2024-03-12'
        }
      ]);

      setLoading(false);
    };

    fetchData();
  }, [organizationId]);

  // Filter functions
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Event handlers
  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setShowWorkflowBuilder(true);
  };

  const handleEditWorkflow = (workflowId: string) => {
    setSelectedWorkflow(workflowId);
    setShowWorkflowBuilder(true);
  };

  const handleCloseWorkflowBuilder = () => {
    setShowWorkflowBuilder(false);
    setSelectedWorkflow(null);
  };

  // Utility functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'inactive': return 'warning';
      case 'archived': return 'destructive';
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (showWorkflowBuilder) {
    return (
      <WorkflowBuilder
        workflow={selectedWorkflow ? workflows.find(w => w.id === selectedWorkflow) as any : undefined}
        onCancel={handleCloseWorkflowBuilder}
        onSave={(workflow) => {
          console.log('Saving workflow:', workflow);
          handleCloseWorkflowBuilder();
        }}
        onPublish={(workflowId) => {
          console.log('Publishing workflow:', workflowId);
        }}
        onTest={(workflow) => {
          console.log('Testing workflow:', workflow);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow Management</h1>
            <p className="text-gray-600 mt-1">Manage compliance workflows, tasks, and approvals</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Template
            </Button>
            <Button onClick={handleCreateWorkflow}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 mt-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'workflows', label: 'Workflows', icon: '🔄' },
            { id: 'tasks', label: 'Tasks', icon: '📋' },
            { id: 'templates', label: 'Templates', icon: '📄' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-brand-100 text-brand-700 border border-brand-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {workflows.filter(w => w.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                      <p className="text-2xl font-bold text-red-600">
                        {tasks.filter(t => t.status === 'overdue').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.slice(0, 5).map((workflow) => (
                      <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                          <p className="text-sm text-gray-600">{workflow.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(workflow.status)}>
                            {workflow.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWorkflow(workflow.id)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="p-6 space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Workflows Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Version</th>
                      <th>Active Instances</th>
                      <th>Avg. Completion</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkflows.map((workflow) => (
                      <tr key={workflow.id}>
                        <td>
                          <div>
                            <div className="font-medium text-gray-900">{workflow.name}</div>
                            <div className="text-sm text-gray-600">{workflow.description}</div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline">{workflow.category}</Badge>
                        </td>
                        <td>
                          <Badge variant={getStatusBadgeVariant(workflow.status)}>
                            {workflow.status}
                          </Badge>
                        </td>
                        <td>v{workflow.version}</td>
                        <td>{workflow.activeInstances}</td>
                        <td>{workflow.averageCompletionTime}h</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditWorkflow(workflow.id)}
                            >
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <TaskManagement
            tasks={filteredTasks}
            currentUser={currentUser}
            onTaskUpdate={(taskId, updates) => {
              setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
              ));
            }}
          />
        )}

        {activeTab === 'templates' && (
          <WorkflowTemplates
            onCreateFromTemplate={(template) => {
              console.log('Creating workflow from template:', template);
              setShowWorkflowBuilder(true);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <WorkflowAnalytics
            workflows={workflows}
            tasks={tasks}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowManagementInterface;
