/**
 * Configuration for Reporting & Analytics Service
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application settings
  port: parseInt(process.env.PORT || '3005'),
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'reporting-analytics-service',
  },

  // Database Configuration
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'reporting_analytics',
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'reporting_analytics',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '3'),
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

  // Report Generation Configuration
  reports: {
    outputPath: process.env.REPORTS_OUTPUT_PATH || './reports',
    tempPath: process.env.REPORTS_TEMP_PATH || './temp',
    maxFileSize: parseInt(process.env.REPORTS_MAX_FILE_SIZE || '52428800'), // 50MB
    retentionDays: parseInt(process.env.REPORTS_RETENTION_DAYS || '90'),
    formats: (process.env.REPORTS_FORMATS || 'pdf,excel,csv,json').split(','),
    enableWatermark: process.env.REPORTS_ENABLE_WATERMARK !== 'false',
    enableEncryption: process.env.REPORTS_ENABLE_ENCRYPTION === 'true',
    concurrentJobs: parseInt(process.env.REPORTS_CONCURRENT_JOBS || '5'),
    timeout: parseInt(process.env.REPORTS_TIMEOUT || '300000'), // 5 minutes
  },

  // Analytics Configuration
  analytics: {
    enableRealTime: process.env.ANALYTICS_ENABLE_REALTIME !== 'false',
    aggregationInterval: parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL || '300000'), // 5 minutes
    retentionPeriod: parseInt(process.env.ANALYTICS_RETENTION_PERIOD || '365'), // days
    enablePredictive: process.env.ANALYTICS_ENABLE_PREDICTIVE === 'true',
    enableAnomalyDetection: process.env.ANALYTICS_ENABLE_ANOMALY_DETECTION === 'true',
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
    maxMemoryUsage: parseInt(process.env.ANALYTICS_MAX_MEMORY_USAGE || '512'), // MB
  },

  // Dashboard Configuration
  dashboard: {
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || '30000'), // 30 seconds
    enableCaching: process.env.DASHBOARD_ENABLE_CACHING !== 'false',
    cacheTimeout: parseInt(process.env.DASHBOARD_CACHE_TIMEOUT || '300'), // 5 minutes
    maxWidgets: parseInt(process.env.DASHBOARD_MAX_WIDGETS || '20'),
    enableExport: process.env.DASHBOARD_ENABLE_EXPORT !== 'false',
    enableSharing: process.env.DASHBOARD_ENABLE_SHARING !== 'false',
  },

  // Scheduler Configuration
  scheduler: {
    enableScheduledReports: process.env.SCHEDULER_ENABLE_SCHEDULED_REPORTS !== 'false',
    maxConcurrentJobs: parseInt(process.env.SCHEDULER_MAX_CONCURRENT_JOBS || '10'),
    retryAttempts: parseInt(process.env.SCHEDULER_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.SCHEDULER_RETRY_DELAY || '60000'), // 1 minute
    cleanupInterval: parseInt(process.env.SCHEDULER_CLEANUP_INTERVAL || '86400000'), // 24 hours
    jobTimeout: parseInt(process.env.SCHEDULER_JOB_TIMEOUT || '1800000'), // 30 minutes
  },

  // Chart Configuration
  charts: {
    defaultWidth: parseInt(process.env.CHARTS_DEFAULT_WIDTH || '800'),
    defaultHeight: parseInt(process.env.CHARTS_DEFAULT_HEIGHT || '600'),
    enableAnimations: process.env.CHARTS_ENABLE_ANIMATIONS !== 'false',
    colorScheme: process.env.CHARTS_COLOR_SCHEME || 'default',
    fontFamily: process.env.CHARTS_FONT_FAMILY || 'Arial, sans-serif',
    fontSize: parseInt(process.env.CHARTS_FONT_SIZE || '12'),
  },

  // Email Configuration
  email: {
    enabled: process.env.EMAIL_ENABLED !== 'false',
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
      reportReady: process.env.EMAIL_TEMPLATE_REPORT_READY || 'report-ready',
      reportFailed: process.env.EMAIL_TEMPLATE_REPORT_FAILED || 'report-failed',
      scheduledReport: process.env.EMAIL_TEMPLATE_SCHEDULED_REPORT || 'scheduled-report',
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    reportWindowMs: parseInt(process.env.REPORT_RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
    maxReports: parseInt(process.env.REPORT_RATE_LIMIT_MAX || '5'),
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
    documentManagement: {
      baseUrl: process.env.DOCUMENT_MANAGEMENT_URL || 'http://localhost:3004',
      apiKey: process.env.DOCUMENT_MANAGEMENT_API_KEY,
      timeout: parseInt(process.env.DOCUMENT_MANAGEMENT_TIMEOUT || '30000'),
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
      reports: parseInt(process.env.CACHE_TTL_REPORTS || '7200'),
      analytics: parseInt(process.env.CACHE_TTL_ANALYTICS || '1800'),
      dashboard: parseInt(process.env.CACHE_TTL_DASHBOARD || '300'),
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'reporting_analytics:',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9092'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    performanceThresholds: {
      responseTime: parseInt(process.env.PERF_RESPONSE_TIME_THRESHOLD || '5000'),
      memoryUsage: parseInt(process.env.PERF_MEMORY_USAGE_THRESHOLD || '1024'),
      cpuUsage: parseInt(process.env.PERF_CPU_USAGE_THRESHOLD || '80'),
    },
  },

  // Feature Flags
  features: {
    advancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS !== 'false',
    realTimeDashboards: process.env.FEATURE_REALTIME_DASHBOARDS !== 'false',
    predictiveAnalytics: process.env.FEATURE_PREDICTIVE_ANALYTICS === 'true',
    customReports: process.env.FEATURE_CUSTOM_REPORTS !== 'false',
    reportScheduling: process.env.FEATURE_REPORT_SCHEDULING !== 'false',
    dataExport: process.env.FEATURE_DATA_EXPORT !== 'false',
  },
};

// Validation
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

export default config;
