/**
 * Database Integration Tests
 * Tests for all database operations and connections
 */

import { databaseService } from '../database/DatabaseService';
import { databaseManager } from '../database/connection';
import PostgreSQLRepository from '../database/repositories/PostgreSQLRepository';
import MongoDBRepository from '../database/repositories/MongoDBRepository';
import RedisRepository from '../database/repositories/RedisRepository';
import ElasticsearchRepository from '../database/repositories/ElasticsearchRepository';

// Mock the database connections for testing
jest.mock('../database/connection', () => ({
  databaseManager: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    healthCheck: jest.fn(),
    getPostgreSQL: jest.fn(),
    getMongoDB: jest.fn(),
    getRedis: jest.fn(),
    getElasticsearch: jest.fn(),
    executeTransaction: jest.fn(),
  },
}));

describe('Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DatabaseService', () => {
    describe('initialize', () => {
      it('should initialize all database connections', async () => {
        const mockConnect = jest.fn().mockResolvedValue(undefined);
        const mockInitializeIndexes = jest.fn().mockResolvedValue(undefined);
        const mockCreateIndexes = jest.fn().mockResolvedValue(undefined);

        (databaseManager.connect as jest.Mock).mockImplementation(mockConnect);
        
        // Mock the elasticsearch and mongodb methods
        jest.spyOn(databaseService.elasticsearch, 'initializeIndexes').mockImplementation(mockInitializeIndexes);
        jest.spyOn(databaseService.mongodb, 'createIndexes').mockImplementation(mockCreateIndexes);

        await databaseService.initialize();

        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(mockInitializeIndexes).toHaveBeenCalledTimes(1);
        expect(mockCreateIndexes).toHaveBeenCalledTimes(1);
      });

      it('should handle initialization errors', async () => {
        const error = new Error('Connection failed');
        (databaseManager.connect as jest.Mock).mockRejectedValue(error);

        await expect(databaseService.initialize()).rejects.toThrow('Connection failed');
      });
    });

    describe('healthCheck', () => {
      it('should return comprehensive health status', async () => {
        const mockHealthCheck = {
          postgresql: true,
          mongodb: true,
          redis: true,
          elasticsearch: true,
        };

        const mockElasticsearchHealth = true;
        const mockRedisStats = { connected: true };
        const mockElasticsearchStats = [{ indexName: 'test', documentCount: 100 }];

        (databaseManager.healthCheck as jest.Mock).mockResolvedValue(mockHealthCheck);
        jest.spyOn(databaseService.elasticsearch, 'healthCheck').mockResolvedValue(mockElasticsearchHealth);
        jest.spyOn(databaseService.redis, 'getStats').mockResolvedValue(mockRedisStats);
        jest.spyOn(databaseService.elasticsearch, 'getIndexStats').mockResolvedValue(mockElasticsearchStats);

        const result = await databaseService.healthCheck();

        expect(result.overall).toBe(true);
        expect(result.databases.postgresql).toBe(true);
        expect(result.databases.mongodb).toBe(true);
        expect(result.databases.redis).toBe(true);
        expect(result.databases.elasticsearch).toBe(true);
        expect(result.details.redis).toEqual(mockRedisStats);
        expect(result.details.elasticsearch).toEqual(mockElasticsearchStats);
      });

      it('should handle partial database failures', async () => {
        const mockHealthCheck = {
          postgresql: true,
          mongodb: false,
          redis: true,
          elasticsearch: true,
        };

        (databaseManager.healthCheck as jest.Mock).mockResolvedValue(mockHealthCheck);
        jest.spyOn(databaseService.elasticsearch, 'healthCheck').mockResolvedValue(true);
        jest.spyOn(databaseService.redis, 'getStats').mockResolvedValue({ connected: true });
        jest.spyOn(databaseService.elasticsearch, 'getIndexStats').mockResolvedValue([]);

        const result = await databaseService.healthCheck();

        expect(result.overall).toBe(false);
        expect(result.databases.mongodb).toBe(false);
      });
    });

    describe('search', () => {
      it('should perform unified search across all sources', async () => {
        const mockCircularResults = {
          hits: [{ _source: { id: '1', title: 'Test Circular' } }],
          total: 1,
        };

        const mockRequirementResults = {
          hits: [{ _source: { id: '2', title: 'Test Requirement' } }],
          total: 1,
        };

        const mockContentResults = [
          { _id: '3', circular_id: 'circular-1', raw_content: 'Test content' },
        ];

        jest.spyOn(databaseService.elasticsearch, 'searchCirculars').mockResolvedValue(mockCircularResults);
        jest.spyOn(databaseService.elasticsearch, 'searchRequirements').mockResolvedValue(mockRequirementResults);
        jest.spyOn(databaseService.mongodb, 'searchCircularContent').mockResolvedValue(mockContentResults);

        const result = await databaseService.search('test query', {
          includeCirculars: true,
          includeRequirements: true,
          includeContent: true,
        });

        expect(result.circulars).toHaveLength(1);
        expect(result.requirements).toHaveLength(1);
        expect(result.content).toHaveLength(1);
        expect(result.total).toBe(3);
      });

      it('should handle search with specific options', async () => {
        const mockCircularResults = {
          hits: [{ _source: { id: '1', title: 'Test Circular' } }],
          total: 1,
        };

        jest.spyOn(databaseService.elasticsearch, 'searchCirculars').mockResolvedValue(mockCircularResults);

        const result = await databaseService.search('test query', {
          includeCirculars: true,
          includeRequirements: false,
          includeContent: false,
          limit: 10,
          page: 1,
          filters: { category: 'Capital Adequacy' },
        });

        expect(result.circulars).toHaveLength(1);
        expect(result.requirements).toBeUndefined();
        expect(result.content).toBeUndefined();
        expect(result.total).toBe(1);
      });
    });

    describe('cache operations', () => {
      it('should handle cache get/set operations', async () => {
        const testKey = 'test-key';
        const testValue = { data: 'test' };

        jest.spyOn(databaseService.redis, 'set').mockResolvedValue(true);
        jest.spyOn(databaseService.redis, 'get').mockResolvedValue(testValue);

        const setResult = await databaseService.cacheSet(testKey, testValue, 3600);
        expect(setResult).toBe(true);

        const getResult = await databaseService.cacheGet(testKey);
        expect(getResult).toEqual(testValue);
      });

      it('should handle cache deletion', async () => {
        const testKey = 'test-key';

        jest.spyOn(databaseService.redis, 'del').mockResolvedValue(true);

        const result = await databaseService.cacheDel(testKey);
        expect(result).toBe(true);
      });

      it('should handle cache flush', async () => {
        jest.spyOn(databaseService.redis, 'flushCache').mockResolvedValue(undefined);

        await expect(databaseService.cacheFlush()).resolves.toBeUndefined();
      });
    });

    describe('session management', () => {
      it('should handle session creation and retrieval', async () => {
        const sessionId = 'session-123';
        const sessionData = {
          user_id: 'user-123',
          organization_id: 'org-123',
          email: 'test@example.com',
          role: 'admin',
          permissions: ['admin'],
          last_activity: new Date(),
          expires_at: new Date(Date.now() + 86400000),
        };

        jest.spyOn(databaseService.redis, 'createSession').mockResolvedValue(true);
        jest.spyOn(databaseService.redis, 'getSession').mockResolvedValue(sessionData);

        const createResult = await databaseService.createSession(sessionId, sessionData);
        expect(createResult).toBe(true);

        const getResult = await databaseService.getSession(sessionId);
        expect(getResult).toEqual(sessionData);
      });

      it('should handle session deletion', async () => {
        const sessionId = 'session-123';

        jest.spyOn(databaseService.redis, 'deleteSession').mockResolvedValue(true);

        const result = await databaseService.deleteSession(sessionId);
        expect(result).toBe(true);
      });
    });

    describe('rate limiting', () => {
      it('should handle rate limit checking', async () => {
        const key = 'user-123';
        const limit = 100;

        jest.spyOn(databaseService.redis, 'incrementRateLimit').mockResolvedValue(5);

        const result = await databaseService.checkRateLimit(key, limit);

        expect(result.allowed).toBe(true);
        expect(result.count).toBe(5);
        expect(result.remaining).toBe(95);
        expect(typeof result.resetTime).toBe('number');
      });

      it('should handle rate limit exceeded', async () => {
        const key = 'user-123';
        const limit = 10;

        jest.spyOn(databaseService.redis, 'incrementRateLimit').mockResolvedValue(15);

        const result = await databaseService.checkRateLimit(key, limit);

        expect(result.allowed).toBe(false);
        expect(result.count).toBe(15);
        expect(result.remaining).toBe(0);
      });
    });

    describe('data synchronization', () => {
      it('should sync circular to Elasticsearch', async () => {
        const circularId = 'circular-123';
        const mockCircular = {
          id: circularId,
          circular_number: 'RBI/2024/001',
          title: 'Test Circular',
          category: 'Capital Adequacy',
          published_date: new Date(),
          impact_level: 'high' as const,
          affected_entities: ['banks'],
          status: 'active' as const,
        };

        const mockContent = {
          _id: 'content-123',
          circular_id: circularId,
          raw_content: 'Test content',
          nlp_analysis: {
            keywords: ['capital', 'adequacy'],
            topics: ['banking', 'regulation'],
          },
        };

        jest.spyOn(databaseService.postgres, 'getCircularById').mockResolvedValue(mockCircular);
        jest.spyOn(databaseService.mongodb, 'getCircularContentByCircularId').mockResolvedValue(mockContent);
        jest.spyOn(databaseService.elasticsearch, 'indexCircular').mockResolvedValue(true);

        const result = await databaseService.syncCircularToElasticsearch(circularId);

        expect(result).toBe(true);
        expect(databaseService.elasticsearch.indexCircular).toHaveBeenCalledWith(
          expect.objectContaining({
            id: circularId,
            circular_number: 'RBI/2024/001',
            title: 'Test Circular',
            content: 'Test content',
            keywords: ['capital', 'adequacy'],
            topics: ['banking', 'regulation'],
          })
        );
      });

      it('should handle sync when circular not found', async () => {
        const circularId = 'non-existent';

        jest.spyOn(databaseService.postgres, 'getCircularById').mockResolvedValue(null);

        const result = await databaseService.syncCircularToElasticsearch(circularId);

        expect(result).toBe(false);
      });
    });

    describe('analytics', () => {
      it('should get comprehensive analytics', async () => {
        const mockCircularsByCategory = [
          { _id: 'Capital Adequacy', count: 10 },
          { _id: 'Risk Management', count: 5 },
        ];

        const mockNotificationsByType = [
          { _id: 'regulatory_change', count: 20 },
          { _id: 'compliance_deadline', count: 15 },
        ];

        const mockElasticsearchAggregations = {
          categories: {
            buckets: [
              { key: 'Capital Adequacy', doc_count: 10 },
            ],
          },
        };

        jest.spyOn(databaseService.mongodb, 'aggregateCircularsByCategory').mockResolvedValue(mockCircularsByCategory);
        jest.spyOn(databaseService.mongodb, 'aggregateNotificationsByType').mockResolvedValue(mockNotificationsByType);
        jest.spyOn(databaseService.elasticsearch, 'getCircularAggregations').mockResolvedValue(mockElasticsearchAggregations);

        const result = await databaseService.getAnalytics();

        expect(result.circulars).toEqual(mockCircularsByCategory);
        expect(result.notifications).toEqual(mockNotificationsByType);
        expect(result.elasticsearch).toEqual(mockElasticsearchAggregations);
      });
    });

    describe('shutdown', () => {
      it('should shutdown all database connections', async () => {
        const mockDisconnect = jest.fn().mockResolvedValue(undefined);
        (databaseManager.disconnect as jest.Mock).mockImplementation(mockDisconnect);

        await databaseService.shutdown();

        expect(mockDisconnect).toHaveBeenCalledTimes(1);
      });

      it('should handle shutdown errors', async () => {
        const error = new Error('Shutdown failed');
        (databaseManager.disconnect as jest.Mock).mockRejectedValue(error);

        await expect(databaseService.shutdown()).rejects.toThrow('Shutdown failed');
      });
    });
  });

  describe('Repository Integration', () => {
    describe('PostgreSQLRepository', () => {
      it('should be properly instantiated', () => {
        expect(() => new PostgreSQLRepository()).not.toThrow();
      });
    });

    describe('MongoDBRepository', () => {
      it('should be properly instantiated', () => {
        expect(() => new MongoDBRepository()).not.toThrow();
      });
    });

    describe('RedisRepository', () => {
      it('should be properly instantiated', () => {
        expect(() => new RedisRepository()).not.toThrow();
      });
    });

    describe('ElasticsearchRepository', () => {
      it('should be properly instantiated', () => {
        expect(() => new ElasticsearchRepository()).not.toThrow();
      });
    });
  });
});
