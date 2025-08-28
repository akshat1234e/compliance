/**
 * Workflow Types and Interfaces
 * Defines all types related to workflow management and orchestration
 */

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export enum StepType {
  TASK = 'task',
  APPROVAL = 'approval',
  NOTIFICATION = 'notification',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  DELAY = 'delay',
  WEBHOOK = 'webhook',
  SCRIPT = 'script',
  HUMAN_TASK = 'human_task',
  SERVICE_CALL = 'service_call',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface WorkflowContext {
  [key: string]: any;
  organizationId?: string;
  userId?: string;
  circularId?: string;
  complianceRequirementId?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: StepType;
  config?: Record<string, any>;
  conditions?: WorkflowCondition[];
  timeout?: number;
  retryable?: boolean;
  maxRetries?: number;
  dependencies?: string[];
  assignees?: string[];
  
  // Runtime properties
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  retryCount: number;
  executionLog?: WorkflowExecutionLogEntry[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  category: string;
  tags?: string[];
  steps: WorkflowStep[];
  variables?: WorkflowVariable[];
  triggers?: WorkflowTrigger[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  config: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  context: WorkflowContext;
  currentStepIndex: number;
  steps: WorkflowStep[];
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  
  // Configuration
  priority: Priority;
  timeout?: number;
  
  // Metadata
  metadata: Record<string, any>;
  tags?: string[];
  
  // Error handling
  error?: string;
  
  // Execution tracking
  executionHistory: WorkflowExecutionLogEntry[];
  
  // Relationships
  parentWorkflowId?: string;
  childWorkflowIds?: string[];
  
  // User context
  initiatedBy: string;
  assignedTo?: string[];
}

export interface WorkflowExecutionLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  stepId?: string;
  data?: Record<string, any>;
}

export interface WorkflowExecution {
  workflowId: string;
  type: 'start' | 'resume' | 'retry_step' | 'cancel';
  stepIndex?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  activeWorkflows: number;
  stepMetrics: Record<string, {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
}

export interface WorkflowSchedule {
  id: string;
  workflowDefinitionId: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  context: WorkflowContext;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowApproval {
  id: string;
  workflowId: string;
  stepId: string;
  title: string;
  description?: string;
  approvers: WorkflowApprover[];
  approvalType: 'any' | 'all' | 'majority';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  deadline?: Date;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface WorkflowApprover {
  userId: string;
  role?: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: Date;
  order?: number;
}

export interface WorkflowTask {
  id: string;
  workflowId: string;
  stepId: string;
  title: string;
  description?: string;
  type: 'manual' | 'automated' | 'review' | 'data_entry' | 'verification';
  assignees: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: Priority;
  dueDate?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  attachments?: WorkflowAttachment[];
  comments?: WorkflowComment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface WorkflowComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  isInternal?: boolean;
  attachments?: WorkflowAttachment[];
}

export interface WorkflowNotification {
  id: string;
  workflowId: string;
  stepId?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  recipients: string[];
  channels: ('email' | 'sms' | 'push' | 'slack' | 'teams')[];
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  scheduledAt?: Date;
  sentAt?: Date;
  metadata?: Record<string, any>;
}

export interface WorkflowIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'database' | 'file' | 'email';
  config: Record<string, any>;
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowAuditLog {
  id: string;
  workflowId: string;
  action: string;
  actor: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Request/Response Types
export interface CreateWorkflowRequest {
  definitionId: string;
  context: WorkflowContext;
  priority?: Priority;
  timeout?: number;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
}

export interface UpdateWorkflowRequest {
  context?: Partial<WorkflowContext>;
  priority?: Priority;
  timeout?: number;
  metadata?: Record<string, any>;
  assignedTo?: string[];
}

export interface WorkflowSearchRequest {
  query?: string;
  status?: WorkflowStatus[];
  priority?: Priority[];
  definitionId?: string;
  initiatedBy?: string;
  assignedTo?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowResponse {
  id: string;
  definitionId: string;
  definitionName: string;
  status: WorkflowStatus;
  priority: Priority;
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  initiatedBy: string;
  assignedTo?: string[];
  metadata: Record<string, any>;
}

export interface WorkflowDetailResponse extends WorkflowResponse {
  definition: WorkflowDefinition;
  context: WorkflowContext;
  steps: WorkflowStep[];
  executionHistory: WorkflowExecutionLogEntry[];
  approvals?: WorkflowApproval[];
  tasks?: WorkflowTask[];
  notifications?: WorkflowNotification[];
}

export interface WorkflowListResponse {
  workflows: WorkflowResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: WorkflowSearchRequest;
}

export interface WorkflowMetricsResponse {
  overview: {
    totalWorkflows: number;
    activeWorkflows: number;
    completedToday: number;
    averageCompletionTime: number;
  };
  statusDistribution: Record<WorkflowStatus, number>;
  priorityDistribution: Record<Priority, number>;
  definitionMetrics: Array<{
    definitionId: string;
    definitionName: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }>;
  performanceTrends: Array<{
    date: string;
    executions: number;
    completions: number;
    averageTime: number;
  }>;
}
