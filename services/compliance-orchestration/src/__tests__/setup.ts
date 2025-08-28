/**
 * Test Setup
 * Global test configuration and setup for the Compliance Orchestration Service
 */

import { config } from '@config/index';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock external dependencies
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  })),
}));

jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    getJob: jest.fn().mockResolvedValue({
      id: 'test-job-id',
      remove: jest.fn().mockResolvedValue(true),
    }),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    getDelayed: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true),
  }));
});

jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
  }),
}));

// Global test timeout
jest.setTimeout(30000);

// Global test hooks
beforeAll(async () => {
  // Global setup before all tests
});

afterAll(async () => {
  // Global cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export test utilities
export const testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    organizationId: 'test-org-id',
    role: 'admin',
    permissions: ['admin'],
    isActive: true,
  }),

  createMockRequest: (overrides = {}) => ({
    user: testUtils.createMockUser(),
    requestId: 'test-request-id',
    ip: '127.0.0.1',
    get: jest.fn(),
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides,
  }),

  createMockResponse: () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      get: jest.fn(),
      end: jest.fn(),
    };
    return res;
  },

  createMockNext: () => jest.fn(),

  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
