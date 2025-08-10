/**
 * Database Service
 * Unified service for all database operations
 */

import { logger } from '@utils/logger';
import { databaseManager } from './connection';
import PostgreSQLRepository from './repositories/PostgreSQLRepository';
import MongoDBRepository from './repositories/MongoDBRepository';
import RedisRepository from './repositories/RedisRepository';
import ElasticsearchRepository from './repositories/ElasticsearchRepository';

export class DatabaseService {
  private static instance: DatabaseService;
  
  public postgres: PostgreSQLRepository;
  public mongodb: MongoDBRepository;
  public redis: RedisRepository;
  public elasticsearch: ElasticsearchRepository;
  
  private isInitialized = false;

  private constructor() {
    // Initialize repositories
    this.postgres = new PostgreSQLRepository();
    this.mongodb = new MongoDBRepository();
    this.redis = new RedisRepository();
    this.elasticsearch = new ElasticsearchRepository();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize all database connections and repositories
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Database service already initialized');
      return;
    }

    try {
      logger.info('Initializing database service...');

      // Connect to all databases
      await databaseManager.connect();

      // Initialize Elasticsearch indexes
      await this.elasticsearch.initializeIndexes();

      // Create MongoDB indexes
      await this.mongodb.createIndexes();

      this.isInitialized = true;
      logger.info('Database service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database service', error);
      throw error;
    }
  }

  /**
   * Health check for all databases
   */
  public async healthCheck(): Promise<{
    overall: boolean;
    databases: Record<string, boolean>;
    details: Record<string, any>;
  }> {
    try {
      const health = await databaseManager.healthCheck();
      const elasticsearchHealth = await this.elasticsearch.healthCheck();
      
      const databases = {
        postgresql: health.postgresql,
        mongodb: health.mongodb,
        redis: health.redis,
        elasticsearch: elasticsearchHealth,
      };

      const overall = Object.values(databases).every(status => status);

      // Get additional details
      const details: Record<string, any> = {};

      // Redis stats
      try {
        details.redis = await this.redis.getStats();
      } catch (error) {
        details.redis = { error: (error as Error).message };
      }

      // Elasticsearch stats
      try {
        details.elasticsearch = await this.elasticsearch.getIndexStats();
      } catch (error) {
        details.elasticsearch = { error: (error as Error).message };
      }

      return {
        overall,
        databases,
        details,
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      return {
        overall: false,
        databases: {
          postgresql: false,
          mongodb: false,
          redis: false,
          elasticsearch: false,
        },
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Unified search across all data sources
   */
  public async search(query: string, options: {
    includeCirculars?: boolean;
    includeRequirements?: boolean;
    includeContent?: boolean;
    limit?: number;
    page?: number;
    filters?: Record<string, any>;
  } = {}): Promise<{
    circulars?: any[];
    requirements?: any[];
    content?: any[];
    total: number;
  }> {
    const {
      includeCirculars = true,
      includeRequirements = true,
      includeContent = true,
      limit = 20,
      page = 1,
      filters = {},
    } = options;

    const results: any = { total: 0 };

    try {
      // Search in Elasticsearch
      if (includeCirculars) {
        const circularResults = await this.elasticsearch.searchCirculars({
          query,
          filters,
          limit,
          page,
        });
        results.circulars = circularResults.hits.map(hit => hit._source);
        results.total += circularResults.total;
      }

      if (includeRequirements) {
        const requirementResults = await this.elasticsearch.searchRequirements({
          query,
          filters,
          limit,
          page,
        });
        results.requirements = requirementResults.hits.map(hit => hit._source);
        results.total += requirementResults.total;
      }

      // Search in MongoDB for content
      if (includeContent) {
        const contentResults = await this.mongodb.searchCircularContent(query, limit);
        results.content = contentResults;
        results.total += contentResults.length;
      }

      logger.info('Unified search completed', {
        query,
        total: results.total,
        includeCirculars,
        includeRequirements,
        includeContent,
      });

      return results;
    } catch (error) {
      logger.error('Unified search failed', {
        query,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cache management utilities
   */
  public async cacheGet<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  public async cacheSet(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.redis.set(key, value, { ttl });
  }

  public async cacheDel(key: string): Promise<boolean> {
    return this.redis.del(key);
  }

  public async cacheFlush(): Promise<void> {
    return this.redis.flushCache();
  }

  /**
   * Session management utilities
   */
  public async createSession(sessionId: string, sessionData: any, ttl?: number): Promise<boolean> {
    return this.redis.createSession(sessionId, sessionData, ttl);
  }

  public async getSession(sessionId: string): Promise<any | null> {
    return this.redis.getSession(sessionId);
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.redis.deleteSession(sessionId);
  }

  /**
   * Rate limiting utilities
   */
  public async checkRateLimit(key: string, limit: number, windowSize?: number): Promise<{
    allowed: boolean;
    count: number;
    remaining: number;
    resetTime: number;
  }> {
    const count = await this.redis.incrementRateLimit(key, windowSize);
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetTime = Date.now() + (windowSize || 60) * 1000;

    return {
      allowed,
      count,
      remaining,
      resetTime,
    };
  }

  /**
   * Analytics and reporting utilities
   */
  public async getAnalytics(): Promise<{
    circulars: any;
    notifications: any;
    elasticsearch: any;
  }> {
    try {
      const [
        circularsByCategory,
        notificationsByType,
        elasticsearchAggregations,
      ] = await Promise.all([
        this.mongodb.aggregateCircularsByCategory(),
        this.mongodb.aggregateNotificationsByType(),
        this.elasticsearch.getCircularAggregations(),
      ]);

      return {
        circulars: circularsByCategory,
        notifications: notificationsByType,
        elasticsearch: elasticsearchAggregations,
      };
    } catch (error) {
      logger.error('Failed to get analytics', error);
      throw error;
    }
  }

  /**
   * Data synchronization utilities
   */
  public async syncCircularToElasticsearch(circularId: string): Promise<boolean> {
    try {
      // Get circular from PostgreSQL
      const circular = await this.postgres.getCircularById(circularId);
      if (!circular) {
        logger.warn('Circular not found for sync', { circularId });
        return false;
      }

      // Get content from MongoDB
      const content = await this.mongodb.getCircularContentByCircularId(circularId);

      // Create searchable document
      const searchableCircular = {
        id: circular.id,
        circular_number: circular.circular_number,
        title: circular.title,
        content: content?.raw_content || '',
        category: circular.category,
        published_date: circular.published_date.toISOString(),
        impact_level: circular.impact_level,
        affected_entities: circular.affected_entities,
        keywords: content?.nlp_analysis?.keywords || [],
        topics: content?.nlp_analysis?.topics || [],
        status: circular.status,
        indexed_at: new Date(),
      };

      // Index in Elasticsearch
      const indexed = await this.elasticsearch.indexCircular(searchableCircular);

      logger.info('Circular synced to Elasticsearch', {
        circularId,
        indexed,
      });

      return indexed;
    } catch (error) {
      logger.error('Failed to sync circular to Elasticsearch', {
        circularId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Bulk operations
   */
  public async bulkSyncToElasticsearch(): Promise<{
    circulars: number;
    requirements: number;
    errors: number;
  }> {
    try {
      logger.info('Starting bulk sync to Elasticsearch');

      let syncedCirculars = 0;
      let syncedRequirements = 0;
      let errors = 0;

      // Sync circulars
      const { data: circulars } = await this.postgres.getCirculars({}, { page: 1, limit: 1000 });
      
      for (const circular of circulars) {
        try {
          const synced = await this.syncCircularToElasticsearch(circular.id);
          if (synced) {
            syncedCirculars++;
          } else {
            errors++;
          }
        } catch (error) {
          errors++;
          logger.error('Error syncing circular', {
            circularId: circular.id,
            error: (error as Error).message,
          });
        }
      }

      // Sync requirements
      const { data: requirements } = await this.postgres.getRequirements({}, { page: 1, limit: 1000 });
      
      const searchableRequirements = requirements.map(req => ({
        id: req.id,
        circular_id: req.circular_id,
        title: req.title,
        description: req.description,
        category: req.category,
        priority: req.priority,
        applicable_entities: req.applicable_entities,
        keywords: [], // Would extract from NLP analysis
        indexed_at: new Date(),
      }));

      if (searchableRequirements.length > 0) {
        await this.elasticsearch.bulkIndex('requirements', searchableRequirements);
        syncedRequirements = searchableRequirements.length;
      }

      logger.info('Bulk sync completed', {
        syncedCirculars,
        syncedRequirements,
        errors,
      });

      return {
        circulars: syncedCirculars,
        requirements: syncedRequirements,
        errors,
      };
    } catch (error) {
      logger.error('Bulk sync failed', error);
      throw error;
    }
  }

  /**
   * Cleanup and maintenance
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('Starting database cleanup');

      // Clear expired cache entries (Redis handles this automatically)
      // Clean up old audit logs (older than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // This would be implemented with actual cleanup queries
      logger.info('Database cleanup completed');
    } catch (error) {
      logger.error('Database cleanup failed', error);
      throw error;
    }
  }

  /**
   * Shutdown all database connections
   */
  public async shutdown(): Promise<void> {
    try {
      await databaseManager.disconnect();
      this.isInitialized = false;
      logger.info('Database service shutdown completed');
    } catch (error) {
      logger.error('Database service shutdown failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
