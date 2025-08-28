/**
 * Integration Types and Interfaces
 * Defines all types related to system integration
 */

export enum IntegrationType {
  BANKING_CORE = 'banking_core',
  REGULATORY = 'regulatory',
  THIRD_PARTY = 'third_party',
  INTERNAL = 'internal',
}

export enum IntegrationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

export enum DataFormat {
  JSON = 'json',
  XML = 'xml',
  CSV = 'csv',
  FIXED_WIDTH = 'fixed_width',
  SOAP = 'soap',
  REST = 'rest',
}

export interface Integration {
  id: string;
  type: IntegrationType;
  system: string;
  operation: string;
  status: IntegrationStatus;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  processingTime?: number;
  
  // Data
  requestData: any;
  responseData?: any;
  
  // Error handling
  error?: string;
  retryCount?: number;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface IntegrationRequest {
  type: IntegrationType;
  system: string;
  operation: string;
  data: any;
  
  // Configuration
  format?: DataFormat;
  timeout?: number;
  retryAttempts?: number;
  
  // Metadata
  metadata?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
}

export interface IntegrationResponse {
  integrationId: string;
  status: IntegrationStatus;
  data?: any;
  error?: string;
  processingTime: number;
  timestamp: Date;
  
  // Metadata
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface ConnectionConfig {
  id: string;
  name: string;
  type: IntegrationType;
  system: string;
  
  // Connection details
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  
  // Authentication
  authType: 'basic' | 'bearer' | 'api_key' | 'oauth2' | 'certificate';
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
    certificate?: string;
    privateKey?: string;
  };
  
  // Configuration
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  
  // Status
  status: ConnectionStatus;
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TransformationRule {
  id: string;
  name: string;
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  
  // Mapping rules
  fieldMappings: FieldMapping[];
  validationRules: ValidationRule[];
  
  // Configuration
  isActive: boolean;
  version: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  defaultValue?: any;
  required: boolean;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  rule: string;
  message: string;
}

export interface EventMessage {
  id: string;
  type: string;
  source: string;
  data: any;
  
  // Timing
  timestamp: Date;
  expiresAt?: Date;
  
  // Routing
  topic?: string;
  routingKey?: string;
  
  // Metadata
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  
  // Security
  secret?: string;
  signatureHeader?: string;
  
  // Configuration
  timeout: number;
  retryAttempts: number;
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Request/Response Types
export interface CreateIntegrationRequest {
  type: IntegrationType;
  system: string;
  operation: string;
  data: any;
  format?: DataFormat;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface IntegrationListResponse {
  integrations: Integration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConnectionResponse {
  id: string;
  name: string;
  type: IntegrationType;
  system: string;
  status: ConnectionStatus;
  isActive: boolean;
  lastConnected?: Date;
  createdAt: Date;
}

export interface TransformationResponse {
  id: string;
  name: string;
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  isActive: boolean;
  version: string;
  createdAt: Date;
}

export interface SystemStatus {
  system: string;
  status: ConnectionStatus;
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
}

export interface IntegrationMetrics {
  totalIntegrations: number;
  successfulIntegrations: number;
  failedIntegrations: number;
  averageResponseTime: number;
  systemStatus: SystemStatus[];
  throughput: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}
