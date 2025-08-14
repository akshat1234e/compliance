import { createClient, RedisClientType } from 'redis'
import { logger } from '../utils/logger'

let redisClient: RedisClientType

export async function connectRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    })

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully')
    })

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...')
    })

    redisClient.on('ready', () => {
      logger.info('Redis ready for commands')
    })

    await redisClient.connect()
    
  } catch (error) {
    logger.error('❌ Redis connection failed:', error)
    throw error
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit()
      logger.info('Redis disconnected')
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error)
    throw error
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized')
  }
  return redisClient
}

// Cache utility functions
export class CacheService {
  private static ttl = parseInt(process.env.CACHE_TTL || '3600') // 1 hour default

  static async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key)
    } catch (error) {
      logger.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const expiry = ttl || this.ttl
      await redisClient.setEx(key, expiry, value)
    } catch (error) {
      logger.error('Cache set error:', error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key)
    } catch (error) {
      logger.error('Cache delete error:', error)
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Cache exists error:', error)
      return false
    }
  }

  static async flush(): Promise<void> {
    try {
      await redisClient.flushAll()
    } catch (error) {
      logger.error('Cache flush error:', error)
    }
  }

  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Cache getJSON error:', error)
      return null
    }
  }

  static async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.set(key, JSON.stringify(value), ttl)
    } catch (error) {
      logger.error('Cache setJSON error:', error)
    }
  }

  static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrBy(key, amount)
    } catch (error) {
      logger.error('Cache increment error:', error)
      return 0
    }
  }

  static async expire(key: string, ttl: number): Promise<void> {
    try {
      await redisClient.expire(key, ttl)
    } catch (error) {
      logger.error('Cache expire error:', error)
    }
  }
}
