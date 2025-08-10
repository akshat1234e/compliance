/**
 * Configuration for Regulatory Intelligence Service
 */

import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  mongodb: {
    uri: string;
    database: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
  };
  elasticsearch: {
    node: string;
    auth?: {
      username: string;
      password: string;
    };
    maxRetries: number;
    requestTimeout: number;
  };
}

interface MessageQueueConfig {
  kafka: {
    clientId: string;
    brokers: string[];
    groupId: string;
    topics: {
      circularScraped: string;
      circularParsed: string;
      impactAssessed: string;
      changeDetected: string;
      notificationSent: string;
    };
  };
  rabbitmq: {
    url: string;
    queues: {
      circularScraping: string;
      parsingNlp: string;
      impactAnalysis: string;
      changeNotification: string;
    };
  };
}

interface ExternalServicesConfig {
  rbi: {
    baseUrl: string;
    circularsUrl: string;
    requestTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  aiService: {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
  };
}

interface Config {
  env: string;
  port: number;
  serviceName: string;
  version: string;
  cors: {
    allowedOrigins: string[];
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  database: DatabaseConfig;
  messageQueue: MessageQueueConfig;
  externalServices: ExternalServicesConfig;
  logging: {
    level: string;
    format: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    bcryptRounds: number;
  };
  scraping: {
    userAgent: string;
    requestDelay: number;
    maxConcurrentRequests: number;
    timeout: number;
  };
  nlp: {
    confidence: {
      minimum: number;
      high: number;
    };
    languages: string[];
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  serviceName: 'regulatory-intelligence',
  version: '1.0.0',

  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8000'
    ],
  },

  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  },

  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'rbi_compliance_dev',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      ssl: process.env.POSTGRES_SSL === 'true',
      maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
    },
    mongodb: {
      uri: process.env.MONGODB_URL || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB || 'rbi_compliance_docs_dev',
      options: {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000', 10),
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      keyPrefix: 'regulatory:',
    },
    elasticsearch: {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD || '',
      } : undefined,
      maxRetries: parseInt(process.env.ELASTICSEARCH_MAX_RETRIES || '3', 10),
      requestTimeout: parseInt(process.env.ELASTICSEARCH_REQUEST_TIMEOUT || '30000', 10),
    },
  },

  messageQueue: {
    kafka: {
      clientId: process.env.KAFKA_CLIENT_ID || 'regulatory-intelligence-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      groupId: process.env.KAFKA_GROUP_ID || 'regulatory-intelligence-group',
      topics: {
        circularScraped: 'regulatory.circular.scraped',
        circularParsed: 'regulatory.circular.parsed',
        impactAssessed: 'regulatory.impact.assessed',
        changeDetected: 'regulatory.change.detected',
        notificationSent: 'regulatory.notification.sent',
      },
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
      queues: {
        circularScraping: 'regulatory.circular.scraping',
        parsingNlp: 'regulatory.parsing.nlp',
        impactAnalysis: 'regulatory.impact.analysis',
        changeNotification: 'regulatory.change.notification',
      },
    },
  },

  externalServices: {
    rbi: {
      baseUrl: process.env.RBI_BASE_URL || 'https://www.rbi.org.in',
      circularsUrl: process.env.RBI_CIRCULARS_URL || 'https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx',
      requestTimeout: parseInt(process.env.RBI_REQUEST_TIMEOUT || '30000', 10),
      retryAttempts: parseInt(process.env.RBI_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.RBI_RETRY_DELAY || '1000', 10),
    },
    aiService: {
      baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:8080',
      apiKey: process.env.AI_SERVICE_API_KEY,
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT || '60000', 10),
    },
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  scraping: {
    userAgent: process.env.SCRAPING_USER_AGENT || 'RBI-Compliance-Bot/1.0',
    requestDelay: parseInt(process.env.SCRAPING_REQUEST_DELAY || '1000', 10),
    maxConcurrentRequests: parseInt(process.env.SCRAPING_MAX_CONCURRENT || '5', 10),
    timeout: parseInt(process.env.SCRAPING_TIMEOUT || '30000', 10),
  },

  nlp: {
    confidence: {
      minimum: parseFloat(process.env.NLP_MIN_CONFIDENCE || '0.7'),
      high: parseFloat(process.env.NLP_HIGH_CONFIDENCE || '0.9'),
    },
    languages: process.env.NLP_LANGUAGES?.split(',') || ['en'],
  },
};

export default config;
