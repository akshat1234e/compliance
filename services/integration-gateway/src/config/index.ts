/**
 * Configuration for Integration Gateway Service
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application settings
  port: parseInt(process.env.PORT || '3007'),
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'integration-gateway-service',
  },

  // Database Configuration
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'integration_gateway',
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'integration_gateway',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '5'),
    },
  },

  // Integration Configuration
  integration: {
    enableRealTimeSync: process.env.INTEGRATION_ENABLE_REALTIME_SYNC !== 'false',
    syncInterval: parseInt(process.env.INTEGRATION_SYNC_INTERVAL || '300000'), // 5 minutes
    maxRetryAttempts: parseInt(process.env.INTEGRATION_MAX_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.INTEGRATION_RETRY_DELAY || '5000'),
    timeout: parseInt(process.env.INTEGRATION_TIMEOUT || '30000'),
    enableBatching: process.env.INTEGRATION_ENABLE_BATCHING !== 'false',
    batchSize: parseInt(process.env.INTEGRATION_BATCH_SIZE || '100'),
    enableCompression: process.env.INTEGRATION_ENABLE_COMPRESSION !== 'false',
  },

  // Banking Core Systems Configuration
  bankingCores: {
    temenos: {
      enabled: process.env.TEMENOS_ENABLED === 'true',
      baseUrl: process.env.TEMENOS_BASE_URL,
      username: process.env.TEMENOS_USERNAME,
      password: process.env.TEMENOS_PASSWORD,
      apiKey: process.env.TEMENOS_API_KEY,
      version: process.env.TEMENOS_VERSION || 'R20',
      timeout: parseInt(process.env.TEMENOS_TIMEOUT || '30000'),
    },
    finacle: {
      enabled: process.env.FINACLE_ENABLED === 'true',
      baseUrl: process.env.FINACLE_BASE_URL,
      username: process.env.FINACLE_USERNAME,
      password: process.env.FINACLE_PASSWORD,
      serviceId: process.env.FINACLE_SERVICE_ID,
      timeout: parseInt(process.env.FINACLE_TIMEOUT || '30000'),
    },
    flexcube: {
      enabled: process.env.FLEXCUBE_ENABLED === 'true',
      baseUrl: process.env.FLEXCUBE_BASE_URL,
      username: process.env.FLEXCUBE_USERNAME,
      password: process.env.FLEXCUBE_PASSWORD,
      timeout: parseInt(process.env.FLEXCUBE_TIMEOUT || '30000'),
    },
    custom: {
      enabled: process.env.CUSTOM_CORE_ENABLED === 'true',
      baseUrl: process.env.CUSTOM_CORE_BASE_URL,
      authType: process.env.CUSTOM_CORE_AUTH_TYPE || 'basic',
      credentials: {
        username: process.env.CUSTOM_CORE_USERNAME,
        password: process.env.CUSTOM_CORE_PASSWORD,
        apiKey: process.env.CUSTOM_CORE_API_KEY,
        token: process.env.CUSTOM_CORE_TOKEN,
      },
    },
  },

  // Third-party Integrations
  thirdParty: {
    rbi: {
      enabled: process.env.RBI_INTEGRATION_ENABLED !== 'false',
      baseUrl: process.env.RBI_BASE_URL || 'https://www.rbi.org.in',
      apiKey: process.env.RBI_API_KEY,
      timeout: parseInt(process.env.RBI_TIMEOUT || '30000'),
    },
    sebi: {
      enabled: process.env.SEBI_INTEGRATION_ENABLED === 'true',
      baseUrl: process.env.SEBI_BASE_URL || 'https://www.sebi.gov.in',
      apiKey: process.env.SEBI_API_KEY,
      timeout: parseInt(process.env.SEBI_TIMEOUT || '30000'),
    },
    irdai: {
      enabled: process.env.IRDAI_INTEGRATION_ENABLED === 'true',
      baseUrl: process.env.IRDAI_BASE_URL || 'https://www.irdai.gov.in',
      apiKey: process.env.IRDAI_API_KEY,
      timeout: parseInt(process.env.IRDAI_TIMEOUT || '30000'),
    },
    cibil: {
      enabled: process.env.CIBIL_INTEGRATION_ENABLED === 'true',
      baseUrl: process.env.CIBIL_BASE_URL,
      memberId: process.env.CIBIL_MEMBER_ID,
      password: process.env.CIBIL_PASSWORD,
      timeout: parseInt(process.env.CIBIL_TIMEOUT || '30000'),
    },
  },

  // Data Transformation Configuration
  transformation: {
    enableValidation: process.env.TRANSFORMATION_ENABLE_VALIDATION !== 'false',
    enableMapping: process.env.TRANSFORMATION_ENABLE_MAPPING !== 'false',
    enableEnrichment: process.env.TRANSFORMATION_ENABLE_ENRICHMENT !== 'false',
    maxPayloadSize: parseInt(process.env.TRANSFORMATION_MAX_PAYLOAD_SIZE || '10485760'), // 10MB
    supportedFormats: (process.env.TRANSFORMATION_SUPPORTED_FORMATS || 'json,xml,csv,fixed-width').split(','),
    enableCaching: process.env.TRANSFORMATION_ENABLE_CACHING !== 'false',
    cacheTimeout: parseInt(process.env.TRANSFORMATION_CACHE_TIMEOUT || '3600'),
  },

  // Event Processing Configuration
  events: {
    enableEventProcessing: process.env.EVENTS_ENABLE_PROCESSING !== 'false',
    enableKafka: process.env.EVENTS_ENABLE_KAFKA !== 'false',
    enableRabbitMQ: process.env.EVENTS_ENABLE_RABBITMQ !== 'false',
    enableWebSockets: process.env.EVENTS_ENABLE_WEBSOCKETS !== 'false',
    kafka: {
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID || 'integration-gateway',
      groupId: process.env.KAFKA_GROUP_ID || 'integration-gateway-group',
      topics: {
        compliance: process.env.KAFKA_TOPIC_COMPLIANCE || 'compliance-events',
        regulatory: process.env.KAFKA_TOPIC_REGULATORY || 'regulatory-events',
        integration: process.env.KAFKA_TOPIC_INTEGRATION || 'integration-events',
      },
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchanges: {
        compliance: process.env.RABBITMQ_EXCHANGE_COMPLIANCE || 'compliance.exchange',
        regulatory: process.env.RABBITMQ_EXCHANGE_REGULATORY || 'regulatory.exchange',
        integration: process.env.RABBITMQ_EXCHANGE_INTEGRATION || 'integration.exchange',
      },
    },
  },

  // Connection Management
  connections: {
    maxConcurrentConnections: parseInt(process.env.CONNECTIONS_MAX_CONCURRENT || '50'),
    connectionTimeout: parseInt(process.env.CONNECTIONS_TIMEOUT || '30000'),
    keepAliveTimeout: parseInt(process.env.CONNECTIONS_KEEP_ALIVE_TIMEOUT || '60000'),
    enableConnectionPooling: process.env.CONNECTIONS_ENABLE_POOLING !== 'false',
    poolSize: parseInt(process.env.CONNECTIONS_POOL_SIZE || '10'),
    enableHealthChecks: process.env.CONNECTIONS_ENABLE_HEALTH_CHECKS !== 'false',
    healthCheckInterval: parseInt(process.env.CONNECTIONS_HEALTH_CHECK_INTERVAL || '60000'),
  },

  // Security Configuration
  security: {
    enableEncryption: process.env.SECURITY_ENABLE_ENCRYPTION !== 'false',
    encryptionAlgorithm: process.env.SECURITY_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    encryptionKey: process.env.SECURITY_ENCRYPTION_KEY,
    enableSignatureValidation: process.env.SECURITY_ENABLE_SIGNATURE_VALIDATION !== 'false',
    signatureSecret: process.env.SECURITY_SIGNATURE_SECRET,
    enableIPWhitelisting: process.env.SECURITY_ENABLE_IP_WHITELISTING === 'true',
    allowedIPs: (process.env.SECURITY_ALLOWED_IPS || '').split(',').filter(Boolean),
  },

  // Webhook Configuration
  webhooks: {
    enableWebhooks: process.env.WEBHOOKS_ENABLE !== 'false',
    maxPayloadSize: parseInt(process.env.WEBHOOKS_MAX_PAYLOAD_SIZE || '5242880'), // 5MB
    timeout: parseInt(process.env.WEBHOOKS_TIMEOUT || '10000'),
    retryAttempts: parseInt(process.env.WEBHOOKS_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.WEBHOOKS_RETRY_DELAY || '1000'),
    enableSignatureValidation: process.env.WEBHOOKS_ENABLE_SIGNATURE_VALIDATION !== 'false',
    secretKey: process.env.WEBHOOKS_SECRET_KEY,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    integrationWindowMs: parseInt(process.env.INTEGRATION_RATE_LIMIT_WINDOW_MS || '60000'),
    maxIntegrationRequests: parseInt(process.env.INTEGRATION_RATE_LIMIT_MAX || '100'),
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
    reportingAnalytics: {
      baseUrl: process.env.REPORTING_ANALYTICS_URL || 'http://localhost:3005',
      apiKey: process.env.REPORTING_ANALYTICS_API_KEY,
      timeout: parseInt(process.env.REPORTING_ANALYTICS_TIMEOUT || '30000'),
    },
    riskAssessment: {
      baseUrl: process.env.RISK_ASSESSMENT_URL || 'http://localhost:3006',
      apiKey: process.env.RISK_ASSESSMENT_API_KEY,
      timeout: parseInt(process.env.RISK_ASSESSMENT_TIMEOUT || '30000'),
    },
  },

  // Cache Configuration
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
      connections: parseInt(process.env.CACHE_TTL_CONNECTIONS || '7200'),
      transformations: parseInt(process.env.CACHE_TTL_TRANSFORMATIONS || '1800'),
      events: parseInt(process.env.CACHE_TTL_EVENTS || '300'),
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'integration_gateway:',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9094'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    performanceThresholds: {
      responseTime: parseInt(process.env.PERF_RESPONSE_TIME_THRESHOLD || '5000'),
      memoryUsage: parseInt(process.env.PERF_MEMORY_USAGE_THRESHOLD || '1024'),
      cpuUsage: parseInt(process.env.PERF_CPU_USAGE_THRESHOLD || '80'),
    },
  },

  // Feature Flags
  features: {
    advancedTransformation: process.env.FEATURE_ADVANCED_TRANSFORMATION !== 'false',
    realTimeSync: process.env.FEATURE_REALTIME_SYNC !== 'false',
    eventStreaming: process.env.FEATURE_EVENT_STREAMING !== 'false',
    dataValidation: process.env.FEATURE_DATA_VALIDATION !== 'false',
    connectionPooling: process.env.FEATURE_CONNECTION_POOLING !== 'false',
    webhookSupport: process.env.FEATURE_WEBHOOK_SUPPORT !== 'false',
  },
};

// Validation
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

export default config;
