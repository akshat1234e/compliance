/**
 * Configuration for Risk Assessment Service
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application settings
  port: parseInt(process.env.PORT || '3006'),
  env: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'risk-assessment-service',
  },

  // Database Configuration
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'risk_assessment',
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'risk_assessment',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '4'),
    },
  },

  // Risk Assessment Configuration
  risk: {
    enableRealTimeScoring: process.env.RISK_ENABLE_REALTIME_SCORING !== 'false',
    scoringInterval: parseInt(process.env.RISK_SCORING_INTERVAL || '300000'), // 5 minutes
    riskThresholds: {
      low: parseFloat(process.env.RISK_THRESHOLD_LOW || '0.3'),
      medium: parseFloat(process.env.RISK_THRESHOLD_MEDIUM || '0.6'),
      high: parseFloat(process.env.RISK_THRESHOLD_HIGH || '0.8'),
      critical: parseFloat(process.env.RISK_THRESHOLD_CRITICAL || '0.9'),
    },
    factors: {
      regulatory: parseFloat(process.env.RISK_FACTOR_REGULATORY || '0.4'),
      operational: parseFloat(process.env.RISK_FACTOR_OPERATIONAL || '0.3'),
      financial: parseFloat(process.env.RISK_FACTOR_FINANCIAL || '0.2'),
      reputational: parseFloat(process.env.RISK_FACTOR_REPUTATIONAL || '0.1'),
    },
    enableHistoricalAnalysis: process.env.RISK_ENABLE_HISTORICAL_ANALYSIS !== 'false',
    historicalPeriod: parseInt(process.env.RISK_HISTORICAL_PERIOD || '365'), // days
  },

  // Machine Learning Configuration
  ml: {
    enablePredictiveModels: process.env.ML_ENABLE_PREDICTIVE_MODELS === 'true',
    modelPath: process.env.ML_MODEL_PATH || './models',
    trainingDataPath: process.env.ML_TRAINING_DATA_PATH || './data/training',
    enableAutoRetraining: process.env.ML_ENABLE_AUTO_RETRAINING === 'true',
    retrainingInterval: parseInt(process.env.ML_RETRAINING_INTERVAL || '604800000'), // 7 days
    modelAccuracyThreshold: parseFloat(process.env.ML_MODEL_ACCURACY_THRESHOLD || '0.85'),
    enableFeatureEngineering: process.env.ML_ENABLE_FEATURE_ENGINEERING !== 'false',
    maxTrainingTime: parseInt(process.env.ML_MAX_TRAINING_TIME || '3600000'), // 1 hour
  },

  // Prediction Configuration
  prediction: {
    enableRiskPrediction: process.env.PREDICTION_ENABLE_RISK_PREDICTION !== 'false',
    predictionHorizon: parseInt(process.env.PREDICTION_HORIZON || '90'), // days
    confidenceThreshold: parseFloat(process.env.PREDICTION_CONFIDENCE_THRESHOLD || '0.8'),
    enableTrendAnalysis: process.env.PREDICTION_ENABLE_TREND_ANALYSIS !== 'false',
    enableAnomalyDetection: process.env.PREDICTION_ENABLE_ANOMALY_DETECTION !== 'false',
    anomalyThreshold: parseFloat(process.env.PREDICTION_ANOMALY_THRESHOLD || '2.0'), // standard deviations
    updateFrequency: parseInt(process.env.PREDICTION_UPDATE_FREQUENCY || '86400000'), // 24 hours
  },

  // Scenario Analysis Configuration
  scenario: {
    enableScenarioAnalysis: process.env.SCENARIO_ENABLE_SCENARIO_ANALYSIS !== 'false',
    maxScenarios: parseInt(process.env.SCENARIO_MAX_SCENARIOS || '100'),
    enableMonteCarloSimulation: process.env.SCENARIO_ENABLE_MONTE_CARLO === 'true',
    simulationIterations: parseInt(process.env.SCENARIO_SIMULATION_ITERATIONS || '10000'),
    enableStressTesting: process.env.SCENARIO_ENABLE_STRESS_TESTING !== 'false',
    stressTestFactors: (process.env.SCENARIO_STRESS_TEST_FACTORS || 'regulatory,market,operational').split(','),
    confidenceLevel: parseFloat(process.env.SCENARIO_CONFIDENCE_LEVEL || '0.95'),
  },

  // Data Processing Configuration
  dataProcessing: {
    batchSize: parseInt(process.env.DATA_PROCESSING_BATCH_SIZE || '1000'),
    maxMemoryUsage: parseInt(process.env.DATA_PROCESSING_MAX_MEMORY_USAGE || '1024'), // MB
    enableParallelProcessing: process.env.DATA_PROCESSING_ENABLE_PARALLEL !== 'false',
    workerThreads: parseInt(process.env.DATA_PROCESSING_WORKER_THREADS || '4'),
    enableDataValidation: process.env.DATA_PROCESSING_ENABLE_VALIDATION !== 'false',
    validationRules: (process.env.DATA_PROCESSING_VALIDATION_RULES || 'completeness,accuracy,consistency').split(','),
  },

  // Alert Configuration
  alerts: {
    enableRiskAlerts: process.env.ALERTS_ENABLE_RISK_ALERTS !== 'false',
    alertThresholds: {
      high: parseFloat(process.env.ALERTS_THRESHOLD_HIGH || '0.8'),
      critical: parseFloat(process.env.ALERTS_THRESHOLD_CRITICAL || '0.9'),
    },
    enableEmailAlerts: process.env.ALERTS_ENABLE_EMAIL !== 'false',
    enableSlackAlerts: process.env.ALERTS_ENABLE_SLACK === 'true',
    enableWebhookAlerts: process.env.ALERTS_ENABLE_WEBHOOK === 'true',
    alertCooldown: parseInt(process.env.ALERTS_COOLDOWN || '3600000'), // 1 hour
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    assessmentWindowMs: parseInt(process.env.ASSESSMENT_RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes
    maxAssessments: parseInt(process.env.ASSESSMENT_RATE_LIMIT_MAX || '10'),
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
  },

  // Cache Configuration
  cache: {
    ttl: {
      default: parseInt(process.env.CACHE_TTL_DEFAULT || '3600'),
      riskScores: parseInt(process.env.CACHE_TTL_RISK_SCORES || '1800'),
      predictions: parseInt(process.env.CACHE_TTL_PREDICTIONS || '7200'),
      scenarios: parseInt(process.env.CACHE_TTL_SCENARIOS || '3600'),
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'risk_assessment:',
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsPort: parseInt(process.env.METRICS_PORT || '9093'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    performanceThresholds: {
      responseTime: parseInt(process.env.PERF_RESPONSE_TIME_THRESHOLD || '3000'),
      memoryUsage: parseInt(process.env.PERF_MEMORY_USAGE_THRESHOLD || '1024'),
      cpuUsage: parseInt(process.env.PERF_CPU_USAGE_THRESHOLD || '80'),
    },
  },

  // Feature Flags
  features: {
    advancedRiskModeling: process.env.FEATURE_ADVANCED_RISK_MODELING !== 'false',
    realTimePredictions: process.env.FEATURE_REALTIME_PREDICTIONS !== 'false',
    scenarioAnalysis: process.env.FEATURE_SCENARIO_ANALYSIS !== 'false',
    machineLearning: process.env.FEATURE_MACHINE_LEARNING === 'true',
    stressTesting: process.env.FEATURE_STRESS_TESTING !== 'false',
    riskVisualization: process.env.FEATURE_RISK_VISUALIZATION !== 'false',
  },
};

// Validation
if (!config.jwt.secret || config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
  if (config.env === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

export default config;
