/** @type {import('jest').Config} */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Projects configuration for monorepo
  projects: [
    // Frontend tests
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/**/*.test.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/frontend/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '^@/components/(.*)$': '<rootDir>/frontend/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/frontend/src/lib/$1',
        '^@/hooks/(.*)$': '<rootDir>/frontend/src/hooks/$1',
        '^@/types/(.*)$': '<rootDir>/frontend/src/types/$1',
        '^@/utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/frontend/__mocks__/fileMock.js'
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
      },
      collectCoverageFrom: [
        'frontend/src/**/*.{js,jsx,ts,tsx}',
        '!frontend/src/**/*.d.ts',
        '!frontend/src/**/*.stories.{js,jsx,ts,tsx}',
        '!frontend/src/**/index.{js,jsx,ts,tsx}'
      ]
    },
    
    // Backend services tests
    {
      displayName: 'regulatory-intelligence',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/regulatory-intelligence/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/regulatory-intelligence/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/regulatory-intelligence/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/regulatory-intelligence/src/**/*.{js,ts}',
        '!services/regulatory-intelligence/src/**/*.d.ts',
        '!services/regulatory-intelligence/src/**/index.{js,ts}'
      ]
    },
    
    {
      displayName: 'compliance-orchestration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/compliance-orchestration/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/compliance-orchestration/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/compliance-orchestration/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/compliance-orchestration/src/**/*.{js,ts}',
        '!services/compliance-orchestration/src/**/*.d.ts',
        '!services/compliance-orchestration/src/**/index.{js,ts}'
      ]
    },
    
    {
      displayName: 'document-management',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/document-management/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/document-management/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/document-management/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/document-management/src/**/*.{js,ts}',
        '!services/document-management/src/**/*.d.ts',
        '!services/document-management/src/**/index.{js,ts}'
      ]
    },
    
    {
      displayName: 'risk-assessment',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/risk-assessment/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/risk-assessment/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/risk-assessment/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/risk-assessment/src/**/*.{js,ts}',
        '!services/risk-assessment/src/**/*.d.ts',
        '!services/risk-assessment/src/**/index.{js,ts}'
      ]
    },
    
    {
      displayName: 'reporting-analytics',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/reporting-analytics/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/reporting-analytics/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/reporting-analytics/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/reporting-analytics/src/**/*.{js,ts}',
        '!services/reporting-analytics/src/**/*.d.ts',
        '!services/reporting-analytics/src/**/index.{js,ts}'
      ]
    },
    
    {
      displayName: 'integration-gateway',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/services/integration-gateway/**/*.test.{js,ts}'],
      setupFilesAfterEnv: ['<rootDir>/services/integration-gateway/jest.setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/services/integration-gateway/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'services/integration-gateway/src/**/*.{js,ts}',
        '!services/integration-gateway/src/**/*.d.ts',
        '!services/integration-gateway/src/**/index.{js,ts}'
      ]
    },
    
    // AI/ML services tests
    {
      displayName: 'ai-services',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/ai-services/**/*.test.py'],
      runner: '@jest-runner/python',
      setupFilesAfterEnv: ['<rootDir>/ai-services/pytest.ini'],
      collectCoverageFrom: [
        'ai-services/src/**/*.py',
        '!ai-services/src/**/__init__.py',
        '!ai-services/src/**/conftest.py'
      ]
    },
    
    // Shared libraries tests
    {
      displayName: 'shared',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/shared/**/*.test.{js,ts}'],
      moduleNameMapping: {
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(js|ts)$': 'ts-jest'
      },
      collectCoverageFrom: [
        'shared/**/*.{js,ts}',
        '!shared/**/*.d.ts',
        '!shared/**/index.{js,ts}'
      ]
    }
  ],
  
  // Global configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './frontend/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './ai-services/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'py'],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '<rootDir>/docs/'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library))'
  ],
  
  // Verbose output
  verbose: true,
  
  // Bail on first test failure in CI
  bail: process.env.CI ? 1 : 0,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Notify mode
  notify: false,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: 'coverage/html-report',
      filename: 'report.html',
      expand: true
    }]
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};
