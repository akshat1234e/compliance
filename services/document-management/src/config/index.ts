/**
 * Configuration for Document Management Service
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application settings
  port: parseInt(process.env.PORT || '3004'),
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'document-management-service',
  },

  // Database Configuration
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'document_management',
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'document_management',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '2'),
    },
    elasticsearch: {
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD || '',
      } : undefined,
      requestTimeout: parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3'),
    },
  },

  // Storage Configuration
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local', // local, aws, azure, gcp, minio
    local: {
      uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
      tempPath: process.env.LOCAL_TEMP_PATH || './temp',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
    },
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'compliance-documents',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    azure: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT,
      accountKey: process.env.AZURE_STORAGE_KEY,
      containerName: process.env.AZURE_CONTAINER || 'documents',
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
      bucketName: process.env.GCP_BUCKET || 'compliance-documents',
    },
    minio: {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      bucketName: process.env.MINIO_BUCKET || 'documents',
    },
  },

  // Document Processing Configuration
  processing: {
    enableOCR: process.env.ENABLE_OCR !== 'false',
    enableClassification: process.env.ENABLE_CLASSIFICATION !== 'false',
    enableThumbnails: process.env.ENABLE_THUMBNAILS !== 'false',
    enableVersioning: process.env.ENABLE_VERSIONING !== 'false',
    maxProcessingTime: parseInt(process.env.MAX_PROCESSING_TIME || '300000'), // 5 minutes
    supportedFormats: (process.env.SUPPORTED_FORMATS || 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png,tiff').split(','),
    thumbnailSizes: [
      { width: 150, height: 150, suffix: 'thumb' },
      { width: 300, height: 300, suffix: 'medium' },
      { width: 800, height: 600, suffix: 'large' },
    ],
  },

  // OCR Configuration
  ocr: {
    engine: process.env.OCR_ENGINE || 'tesseract', // tesseract, aws-textract, azure-cognitive
    languages: (process.env.OCR_LANGUAGES || 'eng').split(','),
    confidence: parseFloat(process.env.OCR_CONFIDENCE || '0.7'),
    enablePreprocessing: process.env.OCR_ENABLE_PREPROCESSING !== 'false',
    tesseract: {
      workerPath: process.env.TESSERACT_WORKER_PATH,
      corePath: process.env.TESSERACT_CORE_PATH,
      langPath: process.env.TESSERACT_LANG_PATH,
    },
    aws: {
      region: process.env.AWS_TEXTRACT_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_TEXTRACT_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_TEXTRACT_SECRET_ACCESS_KEY,
    },
    azure: {
      endpoint: process.env.AZURE_COGNITIVE_ENDPOINT,
      apiKey: process.env.AZURE_COGNITIVE_API_KEY,
    },
  },

  // Classification Configuration
  classification: {
    enableAutoClassification: process.env.ENABLE_AUTO_CLASSIFICATION !== 'false',
    confidenceThreshold: parseFloat(process.env.CLASSIFICATION_CONFIDENCE || '0.8'),
    categories: [
      'regulatory_circular',
      'compliance_report',
      'audit_document',
      'policy_document',
      'procedure_manual',
      'training_material',
      'correspondence',
      'legal_document',
      'financial_statement',
      'other',
    ],
    rules: [
      { pattern: /rbi|reserve bank/i, category: 'regulatory_circular', weight: 0.9 },
      { pattern: /compliance|adherence/i, category: 'compliance_report', weight: 0.8 },
      { pattern: /audit|inspection/i, category: 'audit_document', weight: 0.8 },
      { pattern: /policy|guideline/i, category: 'policy_document', weight: 0.7 },
    ],
  },

  // Security Configuration
  security: {
    encryption: {
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here',
    },
    virusScanning: {
      enabled: process.env.VIRUS_SCANNING_ENABLED === 'true',
      provider: process.env.VIRUS_SCAN_PROVIDER || 'clamav',
      quarantinePath: process.env.QUARANTINE_PATH || './quarantine',
    },
    accessControl: {
      enablePermissions: process.env.ENABLE_PERMISSIONS !== 'false',
      defaultPermissions: ['read'],
      adminPermissions: ['read', 'write', 'delete', 'admin'],
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    uploadWindowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
    maxUploads: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10'),
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: {
      enabled: process.env.LOG_FILE_ENABLED !== 'false',
      path: process.env.LOG_FILE_PATH || './logs',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    },
    console: {
      enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
      colorize: process.env.LOG_COLORIZE !== 'false',
    },
  },

  // External Services
  services: {
    complianceOrchestration: {
      baseUrl: process.env.COMPLIANCE_ORCHESTRATION_URL || 'http://localhost:3002',
      apiKey: process.env.COMPLIANCE_ORCHESTRATION_API_KEY,
      timeout: parseInt(process.env.COMPLIANCE_ORCHESTRATION_TIMEOUT || '30000'),
    },
    regulatoryIntelligence: {
      baseUrl: process.env.REGULATORY_INTELLIGENCE_URL || 'http://localhost:3001',
      apiKey: process.env.REGULATORY_INTELLIGENCE_API_KEY,
      timeout: parseInt(process.env.REGULATORY_INTELLIGENCE_TIMEOUT || '30000'),
    },
    userManagement: {
      baseUrl: process.env.USER_MANAGEMENT_URL || 'http://localhost:3003',
      apiKey: process.env.USER_MANAGEMENT_API_KEY,
      timeout: parseInt(process.env.USER_MANAGEMENT_TIMEOUT || '30000'),
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
      documents: parseInt(process.env.CACHE_TTL_DOCUMENTS || '7200'),
      thumbnails: parseInt(process.env.CACHE_TTL_THUMBNAILS || '86400'),
      search: parseInt(process.env.CACHE_TTL_SEARCH || '1800'),
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'document_management:',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9091'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    performanceThresholds: {
      responseTime: parseInt(process.env.PERF_RESPONSE_TIME_THRESHOLD || '2000'),
      memoryUsage: parseInt(process.env.PERF_MEMORY_USAGE_THRESHOLD || '1024'),
      cpuUsage: parseInt(process.env.PERF_CPU_USAGE_THRESHOLD || '80'),
    },
  },

  // Feature Flags
  features: {
    advancedSearch: process.env.FEATURE_ADVANCED_SEARCH !== 'false',
    bulkOperations: process.env.FEATURE_BULK_OPERATIONS !== 'false',
    documentVersioning: process.env.FEATURE_DOCUMENT_VERSIONING !== 'false',
    collaborativeEditing: process.env.FEATURE_COLLABORATIVE_EDITING === 'true',
    documentWorkflows: process.env.FEATURE_DOCUMENT_WORKFLOWS !== 'false',
    aiClassification: process.env.FEATURE_AI_CLASSIFICATION === 'true',
  },
};

// Validation
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

if (!config.security.encryption.key || config.security.encryption.key === 'your-32-character-secret-key-here') {
  if (config.env === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }
}

export default config;
