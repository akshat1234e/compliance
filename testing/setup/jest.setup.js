// Jest Global Setup for RBI Compliance Platform
// Common setup for all test types

const { config } = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Redis = require('ioredis-mock');

// Load test environment variables
config({ path: '.env.test' });

// Global test configuration
global.testConfig = {
  timeout: 30000,
  retries: 2,
  verbose: process.env.TEST_VERBOSE === 'true'
};

// Mock external services
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.pdf',
        Key: 'test-file.pdf',
        Bucket: 'test-bucket'
      })
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('test file content'),
        ContentType: 'application/pdf'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    }),
    listObjects: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: []
      })
    })
  })),
  SES: jest.fn(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'test-message-id'
      })
    })
  })),
  SNS: jest.fn(() => ({
    publish: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'test-message-id'
      })
    })
  }))
}));

// Mock Azure SDK
jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn(() => ({
      getContainerClient: jest.fn(() => ({
        uploadBlockBlob: jest.fn().mockResolvedValue({
          requestId: 'test-request-id'
        }),
        getBlobClient: jest.fn(() => ({
          download: jest.fn().mockResolvedValue({
            readableStreamBody: Buffer.from('test file content')
          }),
          delete: jest.fn().mockResolvedValue({})
        }))
      }))
    }))
  }
}));

// Mock external APIs
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn()
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
}));

// Mock banking system APIs
global.mockBankingAPIs = {
  temenos: {
    authenticate: jest.fn().mockResolvedValue({
      access_token: 'mock-temenos-token',
      expires_in: 3600
    }),
    getCustomers: jest.fn().mockResolvedValue([
      {
        customerId: 'CUST001',
        name: 'Test Customer',
        accountNumber: 'ACC001'
      }
    ]),
    getTransactions: jest.fn().mockResolvedValue([
      {
        transactionId: 'TXN001',
        amount: 1000,
        currency: 'INR',
        date: '2023-12-01'
      }
    ])
  },
  finacle: {
    authenticate: jest.fn().mockResolvedValue({
      sessionId: 'mock-finacle-session',
      status: 'SUCCESS'
    }),
    getAccountDetails: jest.fn().mockResolvedValue({
      accountNumber: 'FIN001',
      balance: 50000,
      currency: 'INR'
    })
  },
  flexcube: {
    login: jest.fn().mockResolvedValue({
      token: 'mock-flexcube-token',
      validity: '2023-12-01T23:59:59Z'
    }),
    getCustomerData: jest.fn().mockResolvedValue({
      customerId: 'FLEX001',
      customerName: 'Test Customer',
      accounts: ['ACC001', 'ACC002']
    })
  }
};

// Mock RBI APIs
global.mockRBIAPIs = {
  getCirculars: jest.fn().mockResolvedValue([
    {
      circularId: 'RBI/2023/001',
      title: 'Test Circular',
      date: '2023-12-01',
      category: 'Banking Regulation'
    }
  ]),
  submitReport: jest.fn().mockResolvedValue({
    reportId: 'RPT001',
    status: 'SUBMITTED',
    submissionDate: '2023-12-01T10:00:00Z'
  })
};

// Mock CIBIL APIs
global.mockCIBILAPIs = {
  getCreditScore: jest.fn().mockResolvedValue({
    customerId: 'CUST001',
    creditScore: 750,
    scoreDate: '2023-12-01',
    grade: 'A'
  }),
  getCreditReport: jest.fn().mockResolvedValue({
    reportId: 'CR001',
    customerId: 'CUST001',
    reportData: 'mock-credit-report-data'
  })
};

// Database setup for tests
let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.DATABASE_URL = mongoUri;
  
  // Disable external service calls
  process.env.DISABLE_EXTERNAL_CALLS = 'true';
  
  // Set test timeouts
  jest.setTimeout(global.testConfig.timeout);
});

afterAll(async () => {
  // Stop in-memory MongoDB
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset mock implementations
  Object.values(global.mockBankingAPIs).forEach(api => {
    Object.values(api).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockClear();
      }
    });
  });
  
  Object.values(global.mockRBIAPIs).forEach(method => {
    if (jest.isMockFunction(method)) {
      method.mockClear();
    }
  });
  
  Object.values(global.mockCIBILAPIs).forEach(method => {
    if (jest.isMockFunction(method)) {
      method.mockClear();
    }
  });
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  // Wait for a specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test data
  generateTestUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    permissions: ['read', 'write']
  }),
  
  generateTestToken: () => 'test-jwt-token',
  
  generateTestCustomer: () => ({
    customerId: 'CUST001',
    name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+91-9876543210',
    address: 'Test Address, Mumbai, India'
  }),
  
  generateTestTransaction: () => ({
    transactionId: 'TXN001',
    customerId: 'CUST001',
    amount: 1000,
    currency: 'INR',
    type: 'CREDIT',
    date: new Date().toISOString(),
    description: 'Test Transaction'
  }),
  
  generateTestCompliance: () => ({
    complianceId: 'COMP001',
    circularId: 'RBI/2023/001',
    status: 'PENDING',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'test-user-id'
  })
};

// Console override for cleaner test output
if (!process.env.TEST_VERBOSE) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep errors visible
  };
}

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests
});
