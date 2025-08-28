/**
 * Database Connection Manager
 * Manages connections to PostgreSQL, MongoDB, Redis, and Elasticsearch
 */

import { Pool, PoolClient } from 'pg';
import { MongoClient, Db } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { logger } from '@utils/logger';
import { config } from '@config/index';

export interface DatabaseConnections {
  postgres: Pool;
  mongodb: Db;
  redis: RedisClientType;
  elasticsearch: ElasticsearchClient;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Partial<DatabaseConnections> = {};
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize all database connections
   */
  public async connect(): Promise<DatabaseConnections> {
    if (this.isConnected) {
      return this.connections as DatabaseConnections;
    }

    try {
      logger.info('Initializing database connections...');

      // Initialize PostgreSQL connection
      await this.connectPostgreSQL();

      // Initialize MongoDB connection
      await this.connectMongoDB();

      // Initialize Redis connection
      await this.connectRedis();

      // Initialize Elasticsearch connection
      await this.connectElasticsearch();

      this.isConnected = true;
      logger.info('All database connections established successfully');

      return this.connections as DatabaseConnections;
    } catch (error) {
      logger.error('Failed to initialize database connections', error);
      throw error;
    }
  }

  /**
   * Connect to PostgreSQL
   */
  private async connectPostgreSQL(): Promise<void> {
    try {
      const pool = new Pool({
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        database: config.database.postgres.database,
        user: config.database.postgres.username,
        password: config.database.postgres.password,
        max: config.database.postgres.maxConnections || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: config.database.postgres.ssl ? {
          rejectUnauthorized: false
        } : false,
      });

      // Test connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.connections.postgres = pool;
      logger.info('PostgreSQL connection established', {
        host: config.database.postgres.host,
        database: config.database.postgres.database,
      });
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL', error);
      throw error;
    }
  }

  /**
   * Connect to MongoDB
   */
  private async connectMongoDB(): Promise<void> {
    try {
      const client = new MongoClient(config.database.mongodb.uri, {
        maxPoolSize: config.database.mongodb.options.maxPoolSize || 10,
        serverSelectionTimeoutMS: config.database.mongodb.options.serverSelectionTimeoutMS || 5000,
        socketTimeoutMS: 45000,
      });

      await client.connect();
      
      // Test connection
      await client.db('admin').command({ ping: 1 });

      const db = client.db(config.database.mongodb.database);
      this.connections.mongodb = db;

      logger.info('MongoDB connection established', {
        database: config.database.mongodb.database,
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  /**
   * Connect to Redis
   */
  private async connectRedis(): Promise<void> {
    try {
      const redisUrl = `redis://${config.database.redis.host}:${config.database.redis.port}`;
      const client = createClient({
        url: redisUrl,
        password: config.database.redis.password,
        database: config.database.redis.db || 0,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      client.on('error', (error) => {
        logger.error('Redis client error', error);
      });

      client.on('connect', () => {
        logger.info('Redis client connected');
      });

      client.on('ready', () => {
        logger.info('Redis client ready');
      });

      await client.connect();
      
      // Test connection
      await client.ping();

      this.connections.redis = client;
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * Connect to Elasticsearch
   */
  private async connectElasticsearch(): Promise<void> {
    try {
      const client = new ElasticsearchClient({
        node: config.database.elasticsearch.node,
        auth: config.database.elasticsearch.auth ? {
          username: config.database.elasticsearch.auth.username,
          password: config.database.elasticsearch.auth.password,
        } : undefined,
        requestTimeout: config.database.elasticsearch.requestTimeout || 30000,
        pingTimeout: 3000,
        maxRetries: config.database.elasticsearch.maxRetries || 3,
      });

      // Test connection
      const health = await client.cluster.health();
      logger.info('Elasticsearch cluster health', {
        status: health.status,
        numberOfNodes: health.number_of_nodes,
      });

      this.connections.elasticsearch = client;
      logger.info('Elasticsearch connection established');
    } catch (error) {
      logger.error('Failed to connect to Elasticsearch', error);
      throw error;
    }
  }

  /**
   * Get PostgreSQL connection
   */
  public getPostgreSQL(): Pool {
    if (!this.connections.postgres) {
      throw new Error('PostgreSQL connection not initialized');
    }
    return this.connections.postgres;
  }

  /**
   * Get MongoDB connection
   */
  public getMongoDB(): Db {
    if (!this.connections.mongodb) {
      throw new Error('MongoDB connection not initialized');
    }
    return this.connections.mongodb;
  }

  /**
   * Get Redis connection
   */
  public getRedis(): RedisClientType {
    if (!this.connections.redis) {
      throw new Error('Redis connection not initialized');
    }
    return this.connections.redis;
  }

  /**
   * Get Elasticsearch connection
   */
  public getElasticsearch(): ElasticsearchClient {
    if (!this.connections.elasticsearch) {
      throw new Error('Elasticsearch connection not initialized');
    }
    return this.connections.elasticsearch;
  }

  /**
   * Execute PostgreSQL transaction
   */
  public async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getPostgreSQL().connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check for all databases
   */
  public async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    // PostgreSQL health check
    try {
      const client = await this.getPostgreSQL().connect();
      await client.query('SELECT 1');
      client.release();
      health.postgresql = true;
    } catch (error) {
      health.postgresql = false;
      logger.error('PostgreSQL health check failed', error);
    }

    // MongoDB health check
    try {
      await this.getMongoDB().admin().ping();
      health.mongodb = true;
    } catch (error) {
      health.mongodb = false;
      logger.error('MongoDB health check failed', error);
    }

    // Redis health check
    try {
      await this.getRedis().ping();
      health.redis = true;
    } catch (error) {
      health.redis = false;
      logger.error('Redis health check failed', error);
    }

    // Elasticsearch health check
    try {
      await this.getElasticsearch().ping();
      health.elasticsearch = true;
    } catch (error) {
      health.elasticsearch = false;
      logger.error('Elasticsearch health check failed', error);
    }

    return health;
  }

  /**
   * Close all database connections
   */
  public async disconnect(): Promise<void> {
    logger.info('Closing database connections...');

    const promises: Promise<void>[] = [];

    if (this.connections.postgres) {
      promises.push(this.connections.postgres.end());
    }

    if (this.connections.mongodb) {
      promises.push(this.connections.mongodb.client.close());
    }

    if (this.connections.redis) {
      promises.push(this.connections.redis.quit());
    }

    if (this.connections.elasticsearch) {
      promises.push(this.connections.elasticsearch.close());
    }

    await Promise.all(promises);
    this.isConnected = false;
    this.connections = {};
    
    logger.info('All database connections closed');
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
