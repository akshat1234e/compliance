/**
 * Configuration for Compliance Orchestration Service
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application settings
  port: parseInt(process.env.PORT || '3002'),
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'compliance-orchestration-service',
  },

  // Database Configuration
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'compliance_orchestration',
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'compliance_orchestration',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '1'), // Use different DB than regulatory service
    },
  },

  // External Services
  services: {
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
    documentManagement: {
      baseUrl: process.env.DOCUMENT_MANAGEMENT_URL || 'http://localhost:3004',
      apiKey: process.env.DOCUMENT_MANAGEMENT_API_KEY,
      timeout: parseInt(process.env.DOCUMENT_MANAGEMENT_TIMEOUT || '30000'),
    },
    auditTrail: {
      baseUrl: process.env.AUDIT_TRAIL_URL || 'http://localhost:3005',
      apiKey: process.env.AUDIT_TRAIL_API_KEY,
      timeout: parseInt(process.env.AUDIT_TRAIL_TIMEOUT || '30000'),
    },
  },

  // Workflow Engine Configuration
  workflow: {
    maxConcurrentWorkflows: parseInt(process.env.MAX_CONCURRENT_WORKFLOWS || '100'),
    defaultTimeout: parseInt(process.env.WORKFLOW_DEFAULT_TIMEOUT || '3600000'), // 1 hour
    retryAttempts: parseInt(process.env.WORKFLOW_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.WORKFLOW_RETRY_DELAY || '5000'),
    enablePersistence: process.env.WORKFLOW_ENABLE_PERSISTENCE !== 'false',
    enableMetrics: process.env.WORKFLOW_ENABLE_METRICS !== 'false',
  },

  // Task Scheduler Configuration
  scheduler: {
    concurrency: parseInt(process.env.SCHEDULER_CONCURRENCY || '10'),
    defaultDelay: parseInt(process.env.SCHEDULER_DEFAULT_DELAY || '1000'),
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3'),
    backoffStrategy: process.env.SCHEDULER_BACKOFF_STRATEGY || 'exponential',
    enableCleanup: process.env.SCHEDULER_ENABLE_CLEANUP !== 'false',
    cleanupInterval: parseInt(process.env.SCHEDULER_CLEANUP_INTERVAL || '3600000'), // 1 hour
  },

  // Notification Configuration
  notifications: {
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'noreply@compliance-platform.com',
      templates: {
        path: process.env.EMAIL_TEMPLATES_PATH || './templates/email',
      },
    },
    slack: {
      enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#compliance',
    },
    teams: {
      enabled: process.env.TEAMS_NOTIFICATIONS_ENABLED === 'true',
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
    },
    inApp: {
      enabled: process.env.IN_APP_NOTIFICATIONS_ENABLED !== 'false',
      retentionDays: parseInt(process.env.IN_APP_RETENTION_DAYS || '30'),
    },
  },

  // Security Configuration
  security: {
    encryption: {
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      key: process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
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

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'pdf,doc,docx,xls,xlsx,txt,csv').split(','),
    destination: process.env.UPLOAD_DESTINATION || './uploads',
    enableVirusScan: process.env.UPLOAD_ENABLE_VIRUS_SCAN === 'true',
  },

  // Cache Configuration
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'), // 1 hour
      workflows: parseInt(process.env.CACHE_TTL_WORKFLOWS || '1800'), // 30 minutes
      tasks: parseInt(process.env.CACHE_TTL_TASKS || '900'), // 15 minutes
      templates: parseInt(process.env.CACHE_TTL_TEMPLATES || '7200'), // 2 hours
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'compliance_orchestration:',
  },

  // Business Rules Configuration
  business: {
    workflow: {
      maxSteps: parseInt(process.env.WORKFLOW_MAX_STEPS || '50'),
      maxParallelTasks: parseInt(process.env.WORKFLOW_MAX_PARALLEL_TASKS || '10'),
      defaultPriority: process.env.WORKFLOW_DEFAULT_PRIORITY || 'medium',
    },
    approval: {
      maxApprovers: parseInt(process.env.APPROVAL_MAX_APPROVERS || '5'),
      defaultTimeout: parseInt(process.env.APPROVAL_DEFAULT_TIMEOUT || '604800000'), // 7 days
      escalationEnabled: process.env.APPROVAL_ESCALATION_ENABLED !== 'false',
      escalationDelay: parseInt(process.env.APPROVAL_ESCALATION_DELAY || '172800000'), // 2 days
    },
    task: {
      maxAssignees: parseInt(process.env.TASK_MAX_ASSIGNEES || '3'),
      defaultDuration: parseInt(process.env.TASK_DEFAULT_DURATION || '86400000'), // 1 day
      autoAssignmentEnabled: process.env.TASK_AUTO_ASSIGNMENT_ENABLED === 'true',
    },
  },

  // Monitoring and Metrics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30 seconds
    performanceThresholds: {
      responseTime: parseInt(process.env.PERF_RESPONSE_TIME_THRESHOLD || '1000'), // 1 second
      memoryUsage: parseInt(process.env.PERF_MEMORY_USAGE_THRESHOLD || '512'), // 512MB
      cpuUsage: parseInt(process.env.PERF_CPU_USAGE_THRESHOLD || '80'), // 80%
    },
  },

  // Feature Flags
  features: {
    advancedWorkflows: process.env.FEATURE_ADVANCED_WORKFLOWS !== 'false',
    aiAssistance: process.env.FEATURE_AI_ASSISTANCE === 'true',
    realTimeUpdates: process.env.FEATURE_REAL_TIME_UPDATES !== 'false',
    bulkOperations: process.env.FEATURE_BULK_OPERATIONS !== 'false',
    customTemplates: process.env.FEATURE_CUSTOM_TEMPLATES !== 'false',
    integrationWebhooks: process.env.FEATURE_INTEGRATION_WEBHOOKS !== 'false',
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
