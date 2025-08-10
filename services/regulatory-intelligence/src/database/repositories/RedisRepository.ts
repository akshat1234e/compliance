/**
 * Redis Repository
 * Data access layer for caching and session management
 */

import { RedisClientType } from 'redis';
import { logger } from '@utils/logger';
import { databaseManager } from '../connection';
import { SessionData, REDIS_PREFIXES } from '../models';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

export class RedisRepository {
  private client: RedisClientType;

  constructor() {
    this.client = databaseManager.getRedis();
  }

  /**
   * Generic cache operations
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;

      let result: string | null;

      if (options.ttl) {
        if (options.nx) {
          result = await this.client.setNX(fullKey, serializedValue);
          if (result) {
            await this.client.expire(fullKey, options.ttl);
          }
        } else if (options.xx) {
          result = await this.client.setXX(fullKey, serializedValue);
          if (result) {
            await this.client.expire(fullKey, options.ttl);
          }
        } else {
          result = await this.client.setEx(fullKey, options.ttl, serializedValue);
        }
      } else {
        if (options.nx) {
          result = await this.client.setNX(fullKey, serializedValue);
        } else if (options.xx) {
          result = await this.client.setXX(fullKey, serializedValue);
        } else {
          result = await this.client.set(fullKey, serializedValue);
        }
      }

      logger.debug('Cache set operation', {
        key: fullKey,
        ttl: options.ttl,
        success: !!result,
      });

      return !!result;
    } catch (error) {
      logger.error('Failed to set cache value', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const value = await this.client.get(fullKey);

      if (value === null) {
        return null;
      }

      const parsed = JSON.parse(value);
      
      logger.debug('Cache get operation', {
        key: fullKey,
        found: true,
      });

      return parsed as T;
    } catch (error) {
      logger.error('Failed to get cache value', {
        key,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const result = await this.client.del(fullKey);

      logger.debug('Cache delete operation', {
        key: fullKey,
        deleted: result > 0,
      });

      return result > 0;
    } catch (error) {
      logger.error('Failed to delete cache value', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Failed to check cache key existence', {
        key,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const result = await this.client.expire(fullKey, ttl);
      return result;
    } catch (error) {
      logger.error('Failed to set cache expiration', {
        key,
        ttl,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      return await this.client.ttl(fullKey);
    } catch (error) {
      logger.error('Failed to get cache TTL', {
        key,
        error: (error as Error).message,
      });
      return -1;
    }
  }

  /**
   * Session management operations
   */
  async createSession(sessionId: string, sessionData: SessionData, ttl: number = 86400): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
      const serializedData = JSON.stringify(sessionData);
      
      const result = await this.client.setEx(fullKey, ttl, serializedData);

      logger.info('Session created', {
        sessionId,
        userId: sessionData.user_id,
        ttl,
      });

      return !!result;
    } catch (error) {
      logger.error('Failed to create session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const fullKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
      const value = await this.client.get(fullKey);

      if (value === null) {
        return null;
      }

      const sessionData = JSON.parse(value) as SessionData;

      // Check if session is expired
      if (new Date() > new Date(sessionData.expires_at)) {
        await this.deleteSession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      logger.error('Failed to get session', {
        sessionId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        return false;
      }

      const updatedSession: SessionData = {
        ...existingSession,
        ...updates,
        last_activity: new Date(),
      };

      const fullKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
      const ttl = await this.client.ttl(fullKey);
      
      if (ttl > 0) {
        const result = await this.client.setEx(fullKey, ttl, JSON.stringify(updatedSession));
        return !!result;
      } else {
        const result = await this.client.set(fullKey, JSON.stringify(updatedSession));
        return !!result;
      }
    } catch (error) {
      logger.error('Failed to update session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
      const result = await this.client.del(fullKey);

      logger.info('Session deleted', {
        sessionId,
        deleted: result > 0,
      });

      return result > 0;
    } catch (error) {
      logger.error('Failed to delete session', {
        sessionId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async extendSession(sessionId: string, additionalTtl: number): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.SESSION}${sessionId}`;
      const currentTtl = await this.client.ttl(fullKey);
      
      if (currentTtl > 0) {
        const newTtl = currentTtl + additionalTtl;
        const result = await this.client.expire(fullKey, newTtl);
        return result;
      }

      return false;
    } catch (error) {
      logger.error('Failed to extend session', {
        sessionId,
        additionalTtl,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Rate limiting operations
   */
  async incrementRateLimit(key: string, windowSize: number = 60): Promise<number> {
    try {
      const fullKey = `${REDIS_PREFIXES.RATE_LIMIT}${key}`;
      
      const multi = this.client.multi();
      multi.incr(fullKey);
      multi.expire(fullKey, windowSize);
      
      const results = await multi.exec();
      const count = results?.[0] as number || 0;

      logger.debug('Rate limit incremented', {
        key: fullKey,
        count,
        windowSize,
      });

      return count;
    } catch (error) {
      logger.error('Failed to increment rate limit', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getRateLimit(key: string): Promise<number> {
    try {
      const fullKey = `${REDIS_PREFIXES.RATE_LIMIT}${key}`;
      const value = await this.client.get(fullKey);
      return value ? parseInt(value) : 0;
    } catch (error) {
      logger.error('Failed to get rate limit', {
        key,
        error: (error as Error).message,
      });
      return 0;
    }
  }

  async resetRateLimit(key: string): Promise<boolean> {
    try {
      const fullKey = `${REDIS_PREFIXES.RATE_LIMIT}${key}`;
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error('Failed to reset rate limit', {
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Queue operations for notifications
   */
  async enqueueNotification(notification: any): Promise<number> {
    try {
      const queueKey = `${REDIS_PREFIXES.NOTIFICATION_QUEUE}pending`;
      const serializedNotification = JSON.stringify(notification);
      
      const result = await this.client.lPush(queueKey, serializedNotification);

      logger.debug('Notification enqueued', {
        notificationId: notification.id,
        queueLength: result,
      });

      return result;
    } catch (error) {
      logger.error('Failed to enqueue notification', {
        notificationId: notification.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async dequeueNotification(): Promise<any | null> {
    try {
      const queueKey = `${REDIS_PREFIXES.NOTIFICATION_QUEUE}pending`;
      const value = await this.client.rPop(queueKey);

      if (value === null) {
        return null;
      }

      const notification = JSON.parse(value);

      logger.debug('Notification dequeued', {
        notificationId: notification.id,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to dequeue notification', error);
      return null;
    }
  }

  async getQueueLength(): Promise<number> {
    try {
      const queueKey = `${REDIS_PREFIXES.NOTIFICATION_QUEUE}pending`;
      return await this.client.lLen(queueKey);
    } catch (error) {
      logger.error('Failed to get queue length', error);
      return 0;
    }
  }

  /**
   * Hash operations for complex data structures
   */
  async hSet(key: string, field: string, value: any): Promise<number> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const serializedValue = JSON.stringify(value);
      return await this.client.hSet(fullKey, field, serializedValue);
    } catch (error) {
      logger.error('Failed to set hash field', {
        key,
        field,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async hGet<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const value = await this.client.hGet(fullKey, field);

      if (value === undefined) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to get hash field', {
        key,
        field,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async hGetAll<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      const hash = await this.client.hGetAll(fullKey);

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value) as T;
      }

      return result;
    } catch (error) {
      logger.error('Failed to get all hash fields', {
        key,
        error: (error as Error).message,
      });
      return {};
    }
  }

  async hDel(key: string, field: string): Promise<number> {
    try {
      const fullKey = `${REDIS_PREFIXES.CACHE}${key}`;
      return await this.client.hDel(fullKey, field);
    } catch (error) {
      logger.error('Failed to delete hash field', {
        key,
        field,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Utility operations
   */
  async flushCache(): Promise<void> {
    try {
      const keys = await this.client.keys(`${REDIS_PREFIXES.CACHE}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      logger.info('Cache flushed', { deletedKeys: keys.length });
    } catch (error) {
      logger.error('Failed to flush cache', error);
      throw error;
    }
  }

  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.client.info();

      return {
        connected: true,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>),
      };
    } catch (error) {
      logger.error('Failed to get Redis stats', error);
      return { connected: false };
    }
  }
}

export default RedisRepository;
