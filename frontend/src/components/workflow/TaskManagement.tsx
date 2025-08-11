/**
 * Task Management Component
 * Comprehensive task management interface with filtering, assignment, and tracking
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
    Modal,
    Table
} from '@/components/ui';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

// Types
export interface Task {
  id: string;
  title: string;
  description: string;
  workflowInstanceId: string;
  workflowName: string;
  taskType: 'review' | 'approval' | 'data_entry' | 'verification' | 'assessment';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  assignedBy: {
    id: string;
    name: string;
  };
  dueDate: string;
  createdDate: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  tags: string[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;
  dependencies: string[];
  outcome?: 'approved' | 'rejected' | 'completed' | 'escalated';
  outcomeReason?: string;
}

export interface TaskManagementProps {
  tasks: any[];
  currentUser: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  };
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  tasks: initialTasks,
  currentUser,
  onTaskUpdate
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'created'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Initialize tasks with mock data
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: 'task-001',
        title: 'Review RBI Circular DBOD.No.123/2024',
        description: 'Comprehensive review of new banking regulations regarding capital adequacy requirements',
        workflowInstanceId: 'wi-001',
        workflowName: 'RBI Circular Review Process',
        taskType: 'review',
        status: 'in_progress',
        priority: 'high',
        assignedTo: {
          id: 'user-001',
          name: 'John Smith',
          role: 'Compliance Analyst'
        },
        assignedBy: {
          id: 'user-002',
          name: 'Sarah Manager'
        },
        dueDate: '2024-03-25T18:00:00Z',
        createdDate: '2024-03-20T09:00:00Z',
        startedAt: '2024-03-21T10:30:00Z',
        estimatedHours: 8,
        actualHours: 4.5,
        progress: 60,
        tags: ['regulatory', 'capital-adequacy', 'urgent'],
        attachments: [
          {
            id: 'att-001',
            name: 'RBI_Circular_DBOD_123_2024.pdf',
            url: '/documents/rbi-circular-123.pdf',
            type: 'pdf'
          }
        ],
        comments: [
          {
            id: 'comment-001',
            author: 'John Smith',
            text: 'Started initial review. Need clarification on section 3.2.',
            createdAt: '2024-03-21T14:30:00Z'
          }
        ],
        dependencies: []
      },
      {
        id: 'task-002',
        title: 'Assess Impact of New KYC Guidelines',
        description: 'Evaluate the impact of updated KYC guidelines on current processes',
        workflowInstanceId: 'wi-002',
        workflowName: 'Compliance Assessment Workflow',
        taskType: 'assessment',
        status: 'pending',
        priority: 'critical',
        assignedTo: {
          id: 'user-003',
          name: 'Sarah Johnson',
          role: 'Senior Compliance Officer'
        },
        assignedBy: {
          id: 'user-002',
          name: 'Sarah Manager'
        },
        dueDate: '2024-03-22T17:00:00Z',
        createdDate: '2024-03-18T11:00:00Z',
        estimatedHours: 12,
        progress: 0,
        tags: ['kyc', 'assessment', 'critical'],
        attachments: [],
        comments: [],
        dependencies: ['task-001']
      },
      {
        id: 'task-003',
        title: 'Approve Risk Management Policy Update',
        description: 'Final approval required for updated risk management policy document',
        workflowInstanceId: 'wi-003',
        workflowName: 'Document Approval Process',
        taskType: 'approval',
        status: 'overdue',
        priority: 'high',
        assignedTo: {
          id: 'user-004',
          name: 'Mike Wilson',
          role: 'Risk Manager'
        },
        assignedBy: {
          id: 'user-005',
          name: 'Policy Team'
        },
        dueDate: '2024-03-20T16:00:00Z',
        createdDate: '2024-03-15T09:00:00Z',
        estimatedHours: 2,
        progress: 0,
        tags: ['approval', 'risk-management', 'overdue'],
        attachments: [
          {
            id: 'att-002',
            name: 'Risk_Management_Policy_v2.1.docx',
            url: '/documents/risk-policy-v2.1.docx',
            type: 'docx'
          }
        ],
        comments: [
          {
            id: 'comment-002',
            author: 'System',
            text: 'Task is overdue. Escalation triggered.',
            createdAt: '2024-03-21T09:00:00Z'
          }
        ],
        dependencies: []
      },
      {
        id: 'task-004',
        title: 'Validate Compliance Checklist',
        description: 'Validate the updated compliance checklist for quarterly review',
        workflowInstanceId: 'wi-002',
        workflowName: 'Compliance Assessment Workflow',
        taskType: 'verification',
        status: 'completed',
        priority: 'medium',
        assignedTo: {
          id: 'user-006',
          name: 'Emily Davis',
          role: 'Compliance Specialist'
        },
        assignedBy: {
          id: 'user-002',
          name: 'Sarah Manager'
        },
        dueDate: '2024-03-18T15:00:00Z',
        createdDate: '2024-03-12T10:00:00Z',
        startedAt: '2024-03-13T09:00:00Z',
        completedAt: '2024-03-17T14:30:00Z',
        estimatedHours: 6,
        actualHours: 5.5,
        progress: 100,
        tags: ['validation', 'checklist', 'completed'],
        attachments: [],
        comments: [
          {
            id: 'comment-003',
            author: 'Emily Davis',
            text: 'Checklist validated successfully. All items verified.',
            createdAt: '2024-03-17T14:30:00Z'
          }
        ],
        dependencies: [],
        outcome: 'completed'
      }
    ];

    setTasks(mockTasks);
    setLoading(false);
  }, [initialTasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignedTo.id === filterAssignee;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created':
          aValue = new Date(a.createdDate);
          bValue = new Date(b.createdDate);
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Event handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskStatusUpdate = (taskId: string, newStatus: Task['status']) => {
    const updatedTask = tasks.find(t => t.id === taskId);
    if (updatedTask) {
      const updates: Partial<Task> = { status: newStatus };

      if (newStatus === 'in_progress' && !updatedTask.startedAt) {
        updates.startedAt = new Date().toISOString();
      } else if (newStatus === 'completed' && !updatedTask.completedAt) {
        updates.completedAt = new Date().toISOString();
        updates.progress = 100;
      }

      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));
      onTaskUpdate(taskId, updates);
    }
  };

  const handleTaskAssignment = (taskId: string, assigneeId: string) => {
    // In real implementation, this would fetch user details
    const updates = {
      assignedTo: {
        id: assigneeId,
        name: 'New Assignee',
        role: 'Role'
      }
    };

    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ));
    onTaskUpdate(taskId, updates);
  };

  // Utility functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'warning';
      case 'overdue': return 'destructive';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'secondary';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="created">Created</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-2 text-sm',
                viewMode === 'table' ? 'bg-brand-100 text-brand-700' : 'text-gray-600'
              )}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-3 py-2 text-sm',
                viewMode === 'kanban' ? 'bg-brand-100 text-brand-700' : 'text-gray-600'
              )}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => isOverdue(t.dueDate, t.status)).length}
              </div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => t.priority === 'critical' || t.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Display */}
      {viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Workflow</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={cn(
                      'cursor-pointer hover:bg-gray-50',
                      isOverdue(task.dueDate, task.status) && 'bg-red-50'
                    )}
                    onClick={() => handleTaskClick(task)}
                  >
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-600 truncate max-w-xs">
                          {task.description}
                        </div>
                        {task.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {task.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">{task.workflowName}</div>
                    </td>
                    <td>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.assignedTo.name}
                        </div>
                        <div className="text-xs text-gray-600">{task.assignedTo.role}</div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td>
                      <div className={cn(
                        'text-sm',
                        isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-gray-900'
                      )}>
                        {formatDate(task.dueDate)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{task.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {task.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusUpdate(task.id, 'in_progress');
                            }}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusUpdate(task.id, 'completed');
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
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
      ) : (
        // Kanban View
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['pending', 'in_progress', 'completed', 'overdue'].map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')} ({filteredAndSortedTasks.filter(t =>
                    status === 'overdue' ? isOverdue(t.dueDate, t.status) : t.status === status
                  ).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredAndSortedTasks
                  .filter(t => status === 'overdue' ? isOverdue(t.dueDate, t.status) : t.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                        <div className="text-xs text-gray-600">
                          {formatDate(task.dueDate)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {task.assignedTo.name}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <Modal
          open={showTaskDetail}
          onClose={() => setShowTaskDetail(false)}
          title={selectedTask.title}
          size="xl"
        >
          <div className="space-y-6">
            {/* Task Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 mb-4">{selectedTask.description}</p>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusBadgeVariant(selectedTask.status)}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Type: {selectedTask.taskType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedTask.progress}%
                </div>
              </div>
            </div>

            {/* Task Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Assignment Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="ml-2 font-medium">{selectedTask.assignedTo.name}</span>
                    <span className="ml-1 text-gray-500">({selectedTask.assignedTo.role})</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Assigned by:</span>
                    <span className="ml-2">{selectedTask.assignedBy.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Workflow:</span>
                    <span className="ml-2">{selectedTask.workflowName}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">{formatDate(selectedTask.createdDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Due:</span>
                    <span className={cn(
                      'ml-2',
                      isOverdue(selectedTask.dueDate, selectedTask.status) ? 'text-red-600 font-medium' : ''
                    )}>
                      {formatDate(selectedTask.dueDate)}
                    </span>
                  </div>
                  {selectedTask.startedAt && (
                    <div>
                      <span className="text-gray-600">Started:</span>
                      <span className="ml-2">{formatDate(selectedTask.startedAt)}</span>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <span className="ml-2">{formatDate(selectedTask.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Effort Tracking */}
            {(selectedTask.estimatedHours || selectedTask.actualHours) && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Effort Tracking</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedTask.estimatedHours && (
                    <div>
                      <span className="text-gray-600">Estimated:</span>
                      <span className="ml-2 font-medium">{selectedTask.estimatedHours}h</span>
                    </div>
                  )}
                  {selectedTask.actualHours && (
                    <div>
                      <span className="text-gray-600">Actual:</span>
                      <span className="ml-2 font-medium">{selectedTask.actualHours}h</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedTask.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedTask.attachments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
                <div className="space-y-2">
                  {selectedTask.attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        📄
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{attachment.name}</div>
                        <div className="text-xs text-gray-600">{attachment.type.toUpperCase()}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {selectedTask.comments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Comments</h4>
                <div className="space-y-3">
                  {selectedTask.comments.map(comment => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-600">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                {selectedTask.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleTaskStatusUpdate(selectedTask.id, 'in_progress');
                      setShowTaskDetail(false);
                    }}
                  >
                    Start Task
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <Button
                    onClick={() => {
                      handleTaskStatusUpdate(selectedTask.id, 'completed');
                      setShowTaskDetail(false);
                    }}
                  >
                    Complete Task
                  </Button>
                )}
                <Button variant="outline">
                  Add Comment
                </Button>
                <Button variant="outline">
                  Reassign
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowTaskDetail(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaskManagement;
