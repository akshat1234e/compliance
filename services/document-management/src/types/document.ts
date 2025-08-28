/**
 * Document Types and Interfaces
 * Defines all types related to document management
 */

export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  TEXT = 'text',
  IMAGE = 'image',
  OTHER = 'other',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  status: DocumentStatus;
  
  // Metadata
  metadata: DocumentMetadata;
  
  // Content
  extractedText?: string;
  ocrConfidence?: number;
  
  // Classification
  categories: string[];
  tags: string[];
  classifications: DocumentClassification[];
  
  // Versioning
  version: number;
  parentId?: string;
  versions?: DocumentVersion[];
  
  // Access Control
  organizationId: string;
  ownerId: string;
  permissions: DocumentPermission[];
  
  // Processing
  processingStatus: ProcessingStatus;
  processingResult?: ProcessingResult;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  uploadedAt: Date;
  processedAt?: Date;
  
  // Storage
  storageProvider: string;
  storageKey: string;
  thumbnails: DocumentThumbnail[];
  
  // Compliance
  retentionPolicy?: RetentionPolicy;
  complianceFlags: string[];
  auditTrail: AuditEntry[];
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: DocumentType;
  mimeType: string;
  extension: string;
  
  // Dates
  createdAt: Date;
  modifiedAt: Date;
  
  // Document-specific metadata
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  
  // Image metadata
  width?: number;
  height?: number;
  format?: string;
  density?: number;
  
  // Office document metadata
  pageCount?: number;
  sheetCount?: number;
  sheetNames?: string[];
  slideCount?: number;
  
  // Custom metadata
  customFields: Record<string, any>;
}

export interface ProcessingResult {
  id: string;
  status: ProcessingStatus;
  filePath: string;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  processingTime?: number;
  
  // Results
  metadata: Partial<DocumentMetadata>;
  extractedText: string;
  ocrConfidence?: number;
  thumbnails: DocumentThumbnail[];
  classifications: DocumentClassification[];
  
  // Errors and warnings
  errors: ProcessingError[];
  warnings?: ProcessingWarning[];
}

export interface ProcessingOptions {
  generateThumbnails?: boolean;
  performOCR?: boolean;
  classify?: boolean;
  extractMetadata?: boolean;
  enableVersioning?: boolean;
  customProcessors?: string[];
}

export interface DocumentClassification {
  category: string;
  confidence: number;
  rule?: string;
  source: 'automatic' | 'manual' | 'ai';
  timestamp: Date;
}

export interface DocumentThumbnail {
  size: string;
  path: string;
  suffix: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  filePath: string;
  fileSize: number;
  checksum: string;
  createdAt: Date;
  createdBy: string;
  comment?: string;
  changes: VersionChange[];
}

export interface VersionChange {
  type: 'content' | 'metadata' | 'permissions';
  field?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
}

export interface DocumentPermission {
  userId?: string;
  roleId?: string;
  permissions: ('read' | 'write' | 'delete' | 'share' | 'admin')[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface RetentionPolicy {
  id: string;
  name: string;
  retentionPeriod: number; // in days
  action: 'archive' | 'delete' | 'review';
  triggers: string[];
  isActive: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProcessingError {
  message: string;
  stack?: string;
  timestamp: Date;
  code?: string;
}

export interface ProcessingWarning {
  message: string;
  type: string;
  timestamp?: Date;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  documentType: DocumentType;
  fields: TemplateField[];
  validationRules: ValidationRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: string;
  description?: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  message: string;
  isActive: boolean;
}

export interface SearchQuery {
  query?: string;
  filters?: SearchFilter[];
  sort?: SearchSort[];
  page?: number;
  limit?: number;
  includeContent?: boolean;
  includeMetadata?: boolean;
}

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
  values?: any[];
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchResult {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations?: SearchAggregation[];
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchAggregation {
  field: string;
  buckets: Array<{
    key: string;
    count: number;
  }>;
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected?: boolean;
  }>;
}

// Request/Response Types
export interface UploadRequest {
  files: Express.Multer.File[];
  metadata?: Record<string, any>;
  tags?: string[];
  categories?: string[];
  processingOptions?: ProcessingOptions;
  organizationId?: string;
}

export interface UploadResponse {
  documents: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    processingId: string;
    status: ProcessingStatus;
  }>;
  totalFiles: number;
  totalSize: number;
  processingIds: string[];
}

export interface DocumentResponse {
  id: string;
  name: string;
  description?: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  status: DocumentStatus;
  categories: string[];
  tags: string[];
  version: number;
  organizationId: string;
  ownerId: string;
  processingStatus: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
  uploadedAt: Date;
  processedAt?: Date;
  thumbnails: DocumentThumbnail[];
  permissions: DocumentPermission[];
}

export interface DocumentDetailResponse extends DocumentResponse {
  metadata: DocumentMetadata;
  extractedText?: string;
  ocrConfidence?: number;
  classifications: DocumentClassification[];
  versions?: DocumentVersion[];
  auditTrail: AuditEntry[];
  retentionPolicy?: RetentionPolicy;
  complianceFlags: string[];
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters?: SearchQuery;
  aggregations?: SearchAggregation[];
}

export interface ProcessingStatusResponse {
  id: string;
  status: ProcessingStatus;
  progress?: number;
  startedAt: Date;
  completedAt?: Date;
  processingTime?: number;
  errors?: ProcessingError[];
  warnings?: ProcessingWarning[];
  result?: {
    extractedTextLength?: number;
    thumbnailsGenerated?: number;
    classificationsFound?: number;
    ocrConfidence?: number;
  };
}
