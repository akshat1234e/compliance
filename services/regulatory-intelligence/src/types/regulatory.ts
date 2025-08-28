/**
 * Type definitions for regulatory intelligence service
 */

export interface RegulatorySource {
  id: string;
  name: string;
  baseUrl: string;
  circularsUrl: string;
  notificationsUrl: string;
  selectors: {
    circularList: string;
    circularTitle: string;
    circularDate: string;
    circularLink: string;
    circularNumber: string;
  };
  schedule: string;
  enabled: boolean;
  lastScanned?: Date;
  metadata?: {
    description?: string;
    jurisdiction?: string;
    category?: string;
    priority?: number;
  };
}

export interface CircularDocument {
  id: string;
  title: string;
  number: string;
  date: Date;
  url: string;
  sourceId: string;
  sourceName: string;
  type: 'circular' | 'notification' | 'guideline' | 'master_direction';
  status: 'new' | 'processing' | 'processed' | 'failed';
  content: string;
  summary: string;
  tags: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    fileSize?: number;
    fileType?: string;
    language?: string;
    pages?: number;
    wordCount?: number;
  };
}

export interface ProcessedCircular extends CircularDocument {
  requirements: ComplianceRequirement[];
  impact: ImpactAssessment;
  analysis: CircularAnalysis;
  keyInformation: KeyInformation;
  processingMetadata: ProcessingMetadata;
}

export interface ComplianceRequirement {
  id: string;
  text: string;
  type: 'mandatory' | 'optional' | 'conditional' | 'reporting' | 'disclosure';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  applicableEntities: string[];
  actions: string[];
  section: string;
  confidence: number;
  dependencies?: string[];
  exemptions?: string[];
  penalties?: string[];
}

export interface ImpactAssessment {
  level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  areas: string[];
  description: string;
  timeline: string;
  affectedEntities: string[];
  riskFactors?: string[];
  mitigationActions?: string[];
  estimatedCost?: {
    implementation: string;
    compliance: string;
    training: string;
  };
}

export interface CircularAnalysis {
  category: string;
  priority: string;
  tags: string[];
  entities: any[];
  sentiment: string;
  confidence: number;
  keyphrases?: any[];
  themes?: string[];
  complexity?: 'low' | 'medium' | 'high';
}

export interface KeyInformation {
  effectiveDate?: Date;
  deadline?: Date;
  applicableEntities: string[];
  keyChanges: string[];
  actionItems: string[];
  definitions?: { [key: string]: string };
  references?: string[];
  contacts?: {
    department?: string;
    email?: string;
    phone?: string;
  };
}

export interface ProcessingMetadata {
  processedAt: Date;
  processingDuration: number;
  contentLength: number;
  requirementsCount: number;
  aiAnalysisVersion: string;
  error?: string;
  retryCount?: number;
  lastRetryAt?: Date;
}

export interface MonitoringResult {
  sourceId: string;
  sourceName: string;
  totalCirculars: number;
  newCirculars: number;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  metadata?: {
    httpStatus?: number;
    responseSize?: number;
    rateLimited?: boolean;
    lastModified?: string;
  };
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'sms' | 'database';
  enabled: boolean;
  config: any;
  lastUsed?: Date;
  successRate?: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  emailTemplate?: string;
  slackTemplate?: any;
  smsTemplate?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface NotificationSubscriber {
  id: string;
  email: string;
  phone?: string;
  name: string;
  organization?: string;
  role?: string;
  channels: string[];
  preferences: {
    sources: string[];
    priorities: string[];
    categories: string[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircularSearchQuery {
  query?: string;
  sources?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  impact?: string[];
  categories?: string[];
  tags?: string[];
  status?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'relevance' | 'impact' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CircularSearchResult {
  circulars: ProcessedCircular[];
  total: number;
  facets: {
    sources: { [key: string]: number };
    impacts: { [key: string]: number };
    categories: { [key: string]: number };
    tags: { [key: string]: number };
  };
  query: CircularSearchQuery;
  executionTime: number;
}

export interface RegulatoryAlert {
  id: string;
  type: 'new_circular' | 'deadline_approaching' | 'high_impact' | 'compliance_gap';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  circularId?: string;
  organizationId?: string;
  userId?: string;
  data: any;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
}

export interface ComplianceGap {
  id: string;
  organizationId: string;
  requirementId: string;
  circularId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'waived';
  deadline?: Date;
  assignedTo?: string;
  estimatedEffort?: string;
  actualEffort?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface RegulatoryTrend {
  period: string;
  sourceId: string;
  sourceName: string;
  totalCirculars: number;
  byCategory: { [key: string]: number };
  byImpact: { [key: string]: number };
  averageProcessingTime: number;
  complianceRate: number;
  topKeywords: string[];
  emergingThemes: string[];
}

export interface AIAnalysisRequest {
  text: string;
  documentType: 'circular' | 'notification' | 'guideline';
  analysisTypes: string[];
  metadata?: any;
}

export interface AIAnalysisResponse {
  success: boolean;
  data: {
    sentiment?: {
      label: string;
      confidence: number;
    };
    entities?: {
      entities: any[];
    };
    classification?: {
      category: string;
      confidence: number;
    };
    keyphrases?: {
      phrases: any[];
    };
    summary?: string;
    requirements?: ComplianceRequirement[];
    impact?: ImpactAssessment;
  };
  error?: string;
  processingTime: number;
}

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
  source: string;
  version: string;
  signature?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    processingTime: number;
    version: string;
  };
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: Date;
  uptime: number;
  environment: string;
  dependencies: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
  metrics?: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
  };
}

export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  queueSize: number;
  lastUpdated: Date;
}

// Enums
export enum CircularStatus {
  NEW = 'new',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RequirementType {
  MANDATORY = 'mandatory',
  OPTIONAL = 'optional',
  CONDITIONAL = 'conditional',
  REPORTING = 'reporting',
  DISCLOSURE = 'disclosure'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  PENDING = 'pending',
  OVERDUE = 'overdue'
}
