/**
 * Notification Types and Interfaces
 * Defines all types related to notification management
 */

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  TEAMS = 'teams',
  IN_APP = 'in_app',
  PUSH = 'push',
  WEBHOOK = 'webhook',
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  PARTIAL = 'partial',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationType {
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
  WORKFLOW_PAUSED = 'workflow_paused',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  APPROVAL_REQUIRED = 'approval_required',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  DEADLINE_REMINDER = 'deadline_reminder',
  COMPLIANCE_ALERT = 'compliance_alert',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom',
}

export interface Notification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  recipients: string[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Timing
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Template and data
  templateId?: string;
  data?: Record<string, any>;
  
  // Attachments
  attachments?: NotificationAttachment[];
  
  // Retry logic
  attempts: number;
  maxAttempts?: number;
  retryDelay?: number;
  
  // Results
  channelResults?: NotificationChannelResult[];
  error?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];
  
  // Context
  workflowId?: string;
  taskId?: string;
  organizationId?: string;
  userId?: string;
  
  // Tracking
  readBy?: string[];
  readAt?: Date[];
  clickedBy?: string[];
  clickedAt?: Date[];
}

export interface NotificationAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isInline?: boolean;
}

export interface NotificationChannelResult {
  channel: NotificationChannel;
  success: boolean;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  messageId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: NotificationType | string;
  subject: string;
  content: string;
  variables?: NotificationVariable[];
  channels: NotificationChannel[];
  isActive: boolean;
  isDefault?: boolean;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  usageCount?: number;
}

export interface NotificationVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  description?: string;
  required?: boolean;
  defaultValue?: any;
  validation?: string; // Regex pattern
}

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'exists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface NotificationAction {
  type: 'send_notification' | 'escalate' | 'create_task' | 'webhook';
  config: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  organizationId?: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  priority: NotificationPriority[];
  quietHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
  frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  resourceType: 'workflow' | 'task' | 'approval' | 'organization';
  resourceId: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationQueue {
  id: string;
  name: string;
  priority: number;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
  isActive: boolean;
  stats: NotificationQueueStats;
}

export interface NotificationQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
}

export interface NotificationMetrics {
  totalSent: number;
  successRate: number;
  averageDeliveryTime: number;
  channelStats: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
    successRate: number;
  }>;
  typeStats: Record<string, {
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  priorityStats: Record<NotificationPriority, number>;
  trends: NotificationTrend[];
}

export interface NotificationTrend {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

// Specific notification types
export interface EmailNotification extends Omit<Notification, 'channels'> {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SlackNotification extends Omit<Notification, 'channels'> {
  channel?: string;
  username?: string;
  iconEmoji?: string;
  iconUrl?: string;
  blocks?: any[]; // Slack Block Kit blocks
  attachments?: any[]; // Slack attachments
}

export interface TeamsNotification extends Omit<Notification, 'channels'> {
  themeColor?: string;
  summary?: string;
  sections?: any[];
  potentialAction?: any[];
}

export interface InAppNotification extends Omit<Notification, 'channels'> {
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  category?: string;
  isRead?: boolean;
  expiresAt?: Date;
}

export interface SMSNotification extends Omit<Notification, 'channels'> {
  phoneNumbers: string[];
  shortMessage: string; // SMS-optimized message
}

export interface PushNotification extends Omit<Notification, 'channels'> {
  deviceTokens: string[];
  badge?: number;
  sound?: string;
  category?: string;
  customData?: Record<string, any>;
}

export interface WebhookNotification extends Omit<Notification, 'channels'> {
  webhookUrl: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload?: Record<string, any>;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffStrategy: 'fixed' | 'exponential';
    initialDelay: number;
  };
}

// Request/Response Types
export interface SendNotificationRequest {
  type: NotificationType | string;
  title: string;
  message: string;
  recipients: string[];
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
  templateId?: string;
  data?: Record<string, any>;
  attachments?: NotificationAttachment[];
  metadata?: Record<string, any>;
  tags?: string[];
  workflowId?: string;
  taskId?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  recipients?: string[];
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface NotificationSearchRequest {
  query?: string;
  status?: NotificationStatus[];
  type?: (NotificationType | string)[];
  priority?: NotificationPriority[];
  channels?: NotificationChannel[];
  recipients?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  workflowId?: string;
  taskId?: string;
  organizationId?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  id: string;
  type: NotificationType | string;
  title: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  recipients: string[];
  createdAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  attempts: number;
  metadata?: Record<string, any>;
}

export interface NotificationDetailResponse extends NotificationResponse {
  message: string;
  templateId?: string;
  data?: Record<string, any>;
  attachments?: NotificationAttachment[];
  channelResults?: NotificationChannelResult[];
  error?: string;
  tags?: string[];
  workflowId?: string;
  taskId?: string;
  readBy?: string[];
  clickedBy?: string[];
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: NotificationSearchRequest;
}

export interface NotificationTemplateResponse {
  id: string;
  name: string;
  description?: string;
  type: NotificationType | string;
  subject: string;
  channels: NotificationChannel[];
  isActive: boolean;
  category?: string;
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplateDetailResponse extends NotificationTemplateResponse {
  content: string;
  variables?: NotificationVariable[];
  tags?: string[];
  createdBy?: string;
}

export interface NotificationMetricsResponse {
  overview: {
    totalNotifications: number;
    sentToday: number;
    successRate: number;
    averageDeliveryTime: number;
  };
  statusDistribution: Record<NotificationStatus, number>;
  channelDistribution: Record<NotificationChannel, number>;
  typeDistribution: Record<string, number>;
  priorityDistribution: Record<NotificationPriority, number>;
  channelPerformance: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    failed: number;
    successRate: number;
    averageDeliveryTime: number;
  }>;
  trends: NotificationTrend[];
  topFailingTypes: Array<{
    type: string;
    failureCount: number;
    failureRate: number;
  }>;
}

export interface NotificationPreferenceResponse {
  id: string;
  userId: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  priority: NotificationPriority[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  frequency?: string;
  isActive: boolean;
  updatedAt: Date;
}
