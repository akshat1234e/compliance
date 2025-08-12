// Test Utilities and Helper Functions
// Common utilities for all test types

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

class TestHelpers {
  /**
   * Generate a valid JWT token for testing
   */
  static generateTestToken(payload = {}, options = {}) {
    const defaultPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    const tokenPayload = { ...defaultPayload, ...payload };
    const tokenOptions = { ...options };

    return jwt.sign(tokenPayload, process.env.JWT_SECRET || 'test-secret', tokenOptions);
  }

  /**
   * Generate an expired JWT token for testing
   */
  static generateExpiredToken(payload = {}) {
    return this.generateTestToken(payload, { expiresIn: '-1h' });
  }

  /**
   * Generate test user data
   */
  static generateTestUser(overrides = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      ...overrides
    };
  }

  /**
   * Generate test customer data
   */
  static generateTestCustomer(overrides = {}) {
    return {
      id: faker.string.uuid(),
      customerId: `CUST${faker.string.numeric(6)}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+91-##########'),
      address: faker.location.streetAddress({ useFullAddress: true }),
      panNumber: faker.string.alphanumeric(10).toUpperCase(),
      aadharNumber: faker.string.numeric(12),
      dateOfBirth: faker.date.past({ years: 50 }),
      customerType: faker.helpers.arrayElement(['INDIVIDUAL', 'CORPORATE']),
      kycStatus: faker.helpers.arrayElement(['PENDING', 'VERIFIED', 'REJECTED']),
      riskCategory: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test transaction data
   */
  static generateTestTransaction(overrides = {}) {
    const amount = faker.number.float({ min: 100, max: 100000, fractionDigits: 2 });
    const type = faker.helpers.arrayElement(['CREDIT', 'DEBIT']);
    
    return {
      id: faker.string.uuid(),
      transactionId: `TXN${faker.string.numeric(10)}`,
      customerId: `CUST${faker.string.numeric(6)}`,
      accountNumber: `ACC${faker.string.numeric(8)}`,
      amount,
      currency: 'INR',
      type,
      status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'FAILED']),
      description: faker.finance.transactionDescription(),
      transactionDate: faker.date.recent(),
      valueDate: faker.date.recent(),
      reference: faker.string.alphanumeric(16),
      channel: faker.helpers.arrayElement(['ONLINE', 'ATM', 'BRANCH', 'MOBILE']),
      location: faker.location.city(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test compliance task data
   */
  static generateTestComplianceTask(overrides = {}) {
    const dueDate = faker.date.future();
    
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      category: faker.helpers.arrayElement([
        'REGULATORY_REPORTING',
        'KYC_COMPLIANCE',
        'AML_MONITORING',
        'RISK_ASSESSMENT',
        'AUDIT_COMPLIANCE'
      ]),
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      status: faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']),
      assignedTo: faker.string.uuid(),
      assignedBy: faker.string.uuid(),
      dueDate: dueDate.toISOString(),
      completedAt: null,
      tags: faker.helpers.arrayElements(['RBI', 'SEBI', 'IRDAI', 'NPCI'], { min: 1, max: 3 }),
      attachments: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test document data
   */
  static generateTestDocument(overrides = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.system.fileName(),
      description: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(['REPORT', 'CERTIFICATE', 'POLICY', 'CIRCULAR']),
      category: faker.helpers.arrayElement(['COMPLIANCE', 'AUDIT', 'RISK', 'REGULATORY']),
      fileName: faker.system.fileName({ extensionCount: 1 }),
      fileSize: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      mimeType: faker.helpers.arrayElement(['application/pdf', 'application/msword', 'application/vnd.ms-excel']),
      uploadedBy: faker.string.uuid(),
      uploadedAt: new Date().toISOString(),
      version: '1.0',
      status: faker.helpers.arrayElement(['ACTIVE', 'ARCHIVED', 'DELETED']),
      tags: faker.helpers.arrayElements(['important', 'confidential', 'public'], { min: 0, max: 2 }),
      metadata: {
        source: faker.helpers.arrayElement(['RBI', 'SEBI', 'INTERNAL']),
        classification: faker.helpers.arrayElement(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'])
      },
      ...overrides
    };
  }

  /**
   * Generate test audit log entry
   */
  static generateTestAuditLog(overrides = {}) {
    return {
      id: faker.string.uuid(),
      action: faker.helpers.arrayElement([
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'CREATE_TASK',
        'UPDATE_TASK',
        'DELETE_TASK',
        'UPLOAD_DOCUMENT',
        'DOWNLOAD_DOCUMENT'
      ]),
      userId: faker.string.uuid(),
      userEmail: faker.internet.email(),
      resourceType: faker.helpers.arrayElement(['USER', 'TASK', 'DOCUMENT', 'CUSTOMER']),
      resourceId: faker.string.uuid(),
      details: {
        userAgent: faker.internet.userAgent(),
        ipAddress: faker.internet.ip(),
        location: faker.location.city()
      },
      level: faker.helpers.arrayElement(['INFO', 'WARN', 'ERROR']),
      timestamp: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate test banking API response
   */
  static generateBankingAPIResponse(system, endpoint, overrides = {}) {
    const responses = {
      temenos: {
        customers: {
          customers: Array.from({ length: 5 }, () => ({
            customerId: `T${faker.string.numeric(6)}`,
            customerName: faker.person.fullName(),
            accountNumber: `ACC${faker.string.numeric(8)}`,
            branch: faker.helpers.arrayElement(['MUMBAI', 'DELHI', 'BANGALORE', 'CHENNAI']),
            customerType: faker.helpers.arrayElement(['INDIVIDUAL', 'CORPORATE']),
            status: 'ACTIVE'
          }))
        },
        transactions: {
          transactions: Array.from({ length: 10 }, () => ({
            transactionId: `T${faker.string.numeric(10)}`,
            accountNumber: `ACC${faker.string.numeric(8)}`,
            amount: faker.number.float({ min: 100, max: 50000, fractionDigits: 2 }),
            currency: 'INR',
            transactionDate: faker.date.recent().toISOString(),
            description: faker.finance.transactionDescription(),
            type: faker.helpers.arrayElement(['CREDIT', 'DEBIT'])
          }))
        }
      },
      finacle: {
        account: {
          accountNumber: `FIN${faker.string.numeric(8)}`,
          accountName: faker.person.fullName(),
          balance: faker.number.float({ min: 1000, max: 1000000, fractionDigits: 2 }),
          currency: 'INR',
          accountType: faker.helpers.arrayElement(['SAVINGS', 'CURRENT', 'FIXED_DEPOSIT']),
          status: 'ACTIVE',
          branch: faker.helpers.arrayElement(['MUMBAI', 'DELHI', 'BANGALORE'])
        }
      },
      flexcube: {
        customer: {
          customerId: `FLEX${faker.string.numeric(6)}`,
          customerName: faker.person.fullName(),
          accounts: Array.from({ length: 3 }, () => `ACC${faker.string.numeric(8)}`),
          branch: faker.helpers.arrayElement(['MUMBAI', 'DELHI', 'BANGALORE']),
          customerType: 'INDIVIDUAL',
          status: 'ACTIVE'
        }
      }
    };

    return {
      ...responses[system]?.[endpoint] || {},
      ...overrides
    };
  }

  /**
   * Create test database records
   */
  static async createTestData(repository, count = 1, generator, overrides = {}) {
    const records = [];
    
    for (let i = 0; i < count; i++) {
      const data = generator({ ...overrides, index: i });
      const record = await repository.create(data);
      records.push(record);
    }
    
    return count === 1 ? records[0] : records;
  }

  /**
   * Clean up test data
   */
  static async cleanupTestData(repository, ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    
    for (const id of ids) {
      try {
        await repository.delete(id);
      } catch (error) {
        // Ignore errors during cleanup
        console.warn(`Failed to cleanup test data with id ${id}:`, error.message);
      }
    }
  }

  /**
   * Wait for a specified time
   */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   */
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.wait(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Mock external API responses
   */
  static mockExternalAPI(mockAxios, responses) {
    Object.entries(responses).forEach(([url, response]) => {
      if (typeof response === 'function') {
        mockAxios.get.mockImplementation((requestUrl) => {
          if (requestUrl.includes(url)) {
            return Promise.resolve({ data: response() });
          }
          return Promise.reject(new Error('Not mocked'));
        });
      } else {
        mockAxios.get.mockImplementation((requestUrl) => {
          if (requestUrl.includes(url)) {
            return Promise.resolve({ data: response });
          }
          return Promise.reject(new Error('Not mocked'));
        });
      }
    });
  }

  /**
   * Assert response structure
   */
  static assertResponseStructure(response, expectedStructure) {
    const checkStructure = (obj, structure, path = '') => {
      Object.entries(structure).forEach(([key, expectedType]) => {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          throw new Error(`Missing property: ${currentPath}`);
        }
        
        if (typeof expectedType === 'string') {
          const actualType = typeof obj[key];
          if (actualType !== expectedType) {
            throw new Error(`Type mismatch at ${currentPath}: expected ${expectedType}, got ${actualType}`);
          }
        } else if (typeof expectedType === 'object' && expectedType !== null) {
          if (Array.isArray(expectedType)) {
            if (!Array.isArray(obj[key])) {
              throw new Error(`Type mismatch at ${currentPath}: expected array, got ${typeof obj[key]}`);
            }
            if (expectedType.length > 0 && obj[key].length > 0) {
              checkStructure(obj[key][0], expectedType[0], `${currentPath}[0]`);
            }
          } else {
            checkStructure(obj[key], expectedType, currentPath);
          }
        }
      });
    };
    
    checkStructure(response, expectedStructure);
  }

  /**
   * Generate test file buffer
   */
  static generateTestFile(type = 'pdf', size = 1024) {
    const headers = {
      pdf: Buffer.from('%PDF-1.4'),
      jpg: Buffer.from([0xFF, 0xD8, 0xFF]),
      png: Buffer.from([0x89, 0x50, 0x4E, 0x47]),
      doc: Buffer.from([0xD0, 0xCF, 0x11, 0xE0])
    };
    
    const header = headers[type] || Buffer.from('TEST');
    const padding = Buffer.alloc(Math.max(0, size - header.length));
    
    return Buffer.concat([header, padding]);
  }

  /**
   * Hash password for testing
   */
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare password for testing
   */
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}

module.exports = { TestHelpers };
