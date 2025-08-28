/**
 * Report Types and Interfaces
 * Defines all types related to reporting and analytics
 */

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  AUDIT_REPORT = 'audit_report',
  REGULATORY_REPORT = 'regulatory_report',
  PERFORMANCE_REPORT = 'performance_report',
  CUSTOM = 'custom',
}

export interface Report {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  format: ReportFormat;
  status: ReportStatus;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  
  // File information
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  
  // Timing
  createdAt: Date;
  completedAt?: Date;
  generationTime?: number;
  
  // User and organization
  createdBy: string;
  organizationId: string;
  
  // Error handling
  error?: string;
  retryCount?: number;
  
  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: ReportType;
  
  // Template structure
  sections: ReportSection[];
  parameters: ReportParameter[];
  
  // Configuration
  supportedFormats: ReportFormat[];
  defaultFormat: ReportFormat;
  
  // Status
  isActive: boolean;
  version: string;
  
  // Timing
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // Usage
  usageCount?: number;
  lastUsed?: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'table' | 'chart' | 'text' | 'image' | 'summary';
  dataKey: string;
  order: number;
  
  // Configuration
  config?: Record<string, any>;
  styling?: Record<string, any>;
  
  // Conditional display
  conditions?: ReportCondition[];
}

export interface ReportParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  
  // Validation
  validation?: string;
  options?: string[];
  
  // Display
  label: string;
  description?: string;
  placeholder?: string;
}

export interface ReportCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ReportData {
  tables?: Record<string, any[]>;
  charts?: Record<string, ChartData>;
  text?: Record<string, string>;
  images?: Record<string, string>;
  summary?: Record<string, any>;
}

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  data: number[];
  labels: string[];
  datasets?: ChartDataset[];
  options?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ReportRequest {
  templateId: string;
  name?: string;
  description?: string;
  format: ReportFormat;
  parameters?: Record<string, any>;
  filters?: Record<string, any>;
  userId: string;
  organizationId: string;
  
  // Scheduling
  scheduleId?: string;
  scheduledFor?: Date;
  
  // Delivery
  emailTo?: string[];
  notifyOnCompletion?: boolean;
  
  // Options
  includeRawData?: boolean;
  compress?: boolean;
  watermark?: boolean;
}

export interface GenerationResult {
  reportId: string;
  status: ReportStatus;
  filePath?: string;
  fileSize?: number;
  generationTime?: number;
  downloadUrl?: string;
  error?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  templateId: string;
  cronExpression: string;
  timezone: string;
  
  // Configuration
  format: ReportFormat;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  
  // Recipients
  emailTo: string[];
  notificationChannels: string[];
  
  // Status
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  
  // Timing
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationId: string;
  
  // History
  runHistory: ScheduledReportRun[];
}

export interface ScheduledReportRun {
  id: string;
  scheduledReportId: string;
  reportId?: string;
  status: ReportStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  generationTime?: number;
}

// Request/Response Types
export interface CreateReportRequest {
  templateId: string;
  name?: string;
  description?: string;
  format: ReportFormat;
  parameters?: Record<string, any>;
  filters?: Record<string, any>;
  scheduleId?: string;
  emailTo?: string[];
  notifyOnCompletion?: boolean;
}

export interface ReportResponse {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  format: ReportFormat;
  status: ReportStatus;
  fileSize?: number;
  generationTime?: number;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  downloadUrl?: string;
}

export interface ReportListResponse {
  reports: ReportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReportTemplateResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: ReportType;
  supportedFormats: ReportFormat[];
  defaultFormat: ReportFormat;
  parameters: ReportParameter[];
  isActive: boolean;
  usageCount?: number;
  lastUsed?: Date;
}

export interface AnalyticsMetrics {
  overview: {
    totalReports: number;
    reportsToday: number;
    averageGenerationTime: number;
    successRate: number;
  };
  formatDistribution: Record<ReportFormat, number>;
  templateUsage: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
  }>;
  trends: Array<{
    date: string;
    reportsGenerated: number;
    averageTime: number;
    successRate: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    reportCount: number;
  }>;
}
