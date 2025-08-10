/**
 * Scheduler Types and Interfaces
 * Defines all types related to task scheduling and job management
 */

export enum TaskStatus {
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskType {
  WORKFLOW_TRIGGER = 'workflow_trigger',
  NOTIFICATION = 'notification',
  DATA_SYNC = 'data_sync',
  REPORT_GENERATION = 'report_generation',
  COMPLIANCE_CHECK = 'compliance_check',
  DEADLINE_REMINDER = 'deadline_reminder',
  AUDIT_LOG = 'audit_log',
  BACKUP = 'backup',
  CLEANUP = 'cleanup',
  HEALTH_CHECK = 'health_check',
}

export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  type: TaskType | string;
  data: Record<string, any>;
  status: TaskStatus;
  priority: TaskPriority | string;
  
  // Scheduling
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Execution
  result?: any;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  
  // Metadata
  createdAt: Date;
  createdBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  
  // Dependencies
  dependencies?: string[];
  dependents?: string[];
  
  // Timeout
  timeout?: number;
  
  // Callbacks
  onSuccess?: string; // Webhook URL or function name
  onFailure?: string;
  onRetry?: string;
}

export interface TaskSchedule {
  id: string;
  taskId: string;
  cronExpression: string;
  timezone: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
  currentRuns: number;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  scheduleId?: string;
  status: TaskStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  logs?: TaskExecutionLog[];
  metrics?: TaskExecutionMetrics;
  retryCount: number;
  executedBy?: string;
  executionContext?: Record<string, any>;
}

export interface TaskExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
}

export interface TaskExecutionMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  networkIO?: number;
  diskIO?: number;
  customMetrics?: Record<string, number>;
}

export interface RecurringJob {
  id: string;
  name: string;
  description?: string;
  schedule: string; // Cron expression
  timezone?: string;
  isActive: boolean;
  
  // Task configuration
  taskType: TaskType | string;
  taskData: Record<string, any>;
  priority?: TaskPriority | string;
  
  // Execution tracking
  runCount: number;
  lastRun?: Date;
  nextRun?: Date;
  successCount?: number;
  failureCount?: number;
  
  // Configuration
  maxRuns?: number;
  startDate?: Date;
  endDate?: Date;
  timeout?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  
  // Error handling
  retryPolicy?: TaskRetryPolicy;
  onFailure?: JobFailureAction;
}

export interface TaskRetryPolicy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay?: number;
  multiplier?: number;
  jitter?: boolean;
}

export interface JobFailureAction {
  type: 'disable' | 'notify' | 'escalate' | 'retry' | 'ignore';
  config?: Record<string, any>;
}

export interface JobExecution {
  id: string;
  jobId: string;
  taskId: string;
  status: TaskStatus;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  logs?: TaskExecutionLog[];
}

export interface TaskQueue {
  name: string;
  concurrency: number;
  priority: number;
  isActive: boolean;
  stats: TaskQueueStats;
}

export interface TaskQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: TaskType | string;
  defaultData: Record<string, any>;
  configSchema: Record<string, any>; // JSON Schema
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: 'success' | 'completion' | 'failure';
  condition?: string; // Expression to evaluate
  createdAt: Date;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  type: 'start' | 'success' | 'failure' | 'retry' | 'timeout';
  recipients: string[];
  channels: ('email' | 'sms' | 'slack' | 'webhook')[];
  template?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TaskMetrics {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
  successRate: number;
  tasksByType: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<TaskStatus, number>;
  queueStats: TaskQueueStats;
  performanceTrends: TaskPerformanceTrend[];
}

export interface TaskPerformanceTrend {
  date: string;
  executions: number;
  successes: number;
  failures: number;
  averageTime: number;
}

export interface SchedulerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  queueConnection: boolean;
  activeJobs: number;
  failedJobs: number;
  lastHealthCheck: Date;
  issues?: string[];
}

// Request/Response Types
export interface CreateTaskRequest {
  name: string;
  description?: string;
  type: TaskType | string;
  data: Record<string, any>;
  priority?: TaskPriority | string;
  scheduledAt?: Date;
  timeout?: number;
  maxRetries?: number;
  dependencies?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  onSuccess?: string;
  onFailure?: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  data?: Record<string, any>;
  priority?: TaskPriority | string;
  scheduledAt?: Date;
  timeout?: number;
  maxRetries?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateRecurringJobRequest {
  name: string;
  description?: string;
  schedule: string;
  timezone?: string;
  taskType: TaskType | string;
  taskData: Record<string, any>;
  priority?: TaskPriority | string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
  timeout?: number;
  retryPolicy?: TaskRetryPolicy;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateRecurringJobRequest {
  name?: string;
  description?: string;
  schedule?: string;
  timezone?: string;
  taskData?: Record<string, any>;
  priority?: TaskPriority | string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  maxRuns?: number;
  timeout?: number;
  retryPolicy?: TaskRetryPolicy;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskSearchRequest {
  query?: string;
  status?: TaskStatus[];
  type?: (TaskType | string)[];
  priority?: (TaskPriority | string)[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskResponse {
  id: string;
  name: string;
  description?: string;
  type: TaskType | string;
  status: TaskStatus;
  priority: TaskPriority | string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  retryCount?: number;
  createdAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface TaskDetailResponse extends TaskResponse {
  data: Record<string, any>;
  result?: any;
  error?: string;
  maxRetries?: number;
  timeout?: number;
  dependencies?: string[];
  dependents?: string[];
  executions?: TaskExecution[];
  logs?: TaskExecutionLog[];
  metadata?: Record<string, any>;
}

export interface RecurringJobResponse {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  timezone?: string;
  isActive: boolean;
  taskType: TaskType | string;
  priority?: TaskPriority | string;
  runCount: number;
  successCount?: number;
  failureCount?: number;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface RecurringJobDetailResponse extends RecurringJobResponse {
  taskData: Record<string, any>;
  maxRuns?: number;
  startDate?: Date;
  endDate?: Date;
  timeout?: number;
  retryPolicy?: TaskRetryPolicy;
  recentExecutions?: JobExecution[];
  metadata?: Record<string, any>;
}

export interface TaskListResponse {
  tasks: TaskResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: TaskSearchRequest;
}

export interface RecurringJobListResponse {
  jobs: RecurringJobResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskMetricsResponse {
  overview: {
    totalTasks: number;
    activeTasks: number;
    completedToday: number;
    failedToday: number;
    averageExecutionTime: number;
    successRate: number;
  };
  statusDistribution: Record<TaskStatus, number>;
  typeDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  queueStats: TaskQueueStats;
  performanceTrends: TaskPerformanceTrend[];
  topFailingTasks: Array<{
    taskId: string;
    taskName: string;
    failureCount: number;
    lastFailure: Date;
  }>;
}
