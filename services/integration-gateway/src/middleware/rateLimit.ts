/**
 * Rate Limiting Middleware
 * Implements rate limiting for webhook API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests per window default
      message: 'Too many requests, please try again later',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (entry.resetTime <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      delete this.store[key];
    });

    if (keysToDelete.length > 0) {
      logger.debug('Rate limit store cleanup', { 
        cleanedEntries: keysToDelete.length,
        remainingEntries: Object.keys(this.store).length 
      });
    }
  }

  private getKey(req: Request): string {
    // Use API key if available, otherwise use IP address
    const apiKey = req.headers['x-api-key'] as string;
    const userId = (req as any).user?.id;
    
    if (apiKey) {
      return `api:${apiKey}`;
    } else if (userId) {
      return `user:${userId}`;
    } else {
      return `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`;
    }
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = this.getKey(req);
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get or create entry for this key
      let entry = this.store[key];
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
        this.store[key] = entry;
      }

      // Check if request should be counted
      const shouldCount = !this.config.skipSuccessfulRequests && !this.config.skipFailedRequests;
      
      if (shouldCount) {
        entry.count++;
      }

      // Check if limit exceeded
      if (entry.count > this.config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

        logger.warn('Rate limit exceeded', {
          key,
          count: entry.count,
          limit: this.config.maxRequests,
          retryAfter,
          userAgent: req.headers['user-agent'],
          path: req.path,
        });

        res.set({
          'X-RateLimit-Limit': this.config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': retryAfter.toString(),
        });

        res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.config.message,
          retryAfter,
        });
        return;
      }

      // Set rate limit headers
      const remaining = Math.max(0, this.config.maxRequests - entry.count);
      res.set({
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': entry.resetTime.toString(),
      });

      // Handle response to update count if needed
      if (this.config.skipSuccessfulRequests || this.config.skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          
          if (
            (this.config.skipSuccessfulRequests && statusCode >= 200 && statusCode < 400) ||
            (this.config.skipFailedRequests && statusCode >= 400)
          ) {
            // Don't count this request
            entry.count--;
          }
          
          return originalSend.call(this, body);
        }.bind(this);
      }

      next();
    } catch (error: any) {
      logger.error('Rate limiting middleware error', error);
      next(); // Continue on error to avoid blocking requests
    }
  };

  public getStats(): { totalKeys: number; entries: Array<{ key: string; count: number; resetTime: number }> } {
    return {
      totalKeys: Object.keys(this.store).length,
      entries: Object.entries(this.store).map(([key, entry]) => ({
        key,
        count: entry.count,
        resetTime: entry.resetTime,
      })),
    };
  }

  public reset(key?: string): void {
    if (key) {
      delete this.store[key];
      logger.info('Rate limit reset for key', { key });
    } else {
      this.store = {};
      logger.info('Rate limit store reset');
    }
  }
}

// Create different rate limiters for different endpoints
const webhookRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many webhook requests, please try again later',
});

const eventPublishRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50, // 50 events per minute
  message: 'Too many events published, please try again later',
});

const testEndpointRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 tests per 5 minutes
  message: 'Too many endpoint tests, please try again later',
});

// Export middleware functions
export const rateLimitMiddleware = webhookRateLimiter.middleware;
export const eventPublishRateLimit = eventPublishRateLimiter.middleware;
export const testEndpointRateLimit = testEndpointRateLimiter.middleware;

// Export rate limiter instances for stats and management
export const rateLimiters = {
  webhook: webhookRateLimiter,
  eventPublish: eventPublishRateLimiter,
  testEndpoint: testEndpointRateLimiter,
};

// Rate limit stats endpoint
export const getRateLimitStats = (req: Request, res: Response): void => {
  try {
    const stats = {
      webhook: webhookRateLimiter.getStats(),
      eventPublish: eventPublishRateLimiter.getStats(),
      testEndpoint: testEndpointRateLimiter.getStats(),
    };

    res.json({
      rateLimitStats: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error fetching rate limit stats', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

// Rate limit reset endpoint (admin only)
export const resetRateLimit = (req: Request, res: Response): void => {
  try {
    const { limiter, key } = req.body;

    if (!limiter || !rateLimiters[limiter as keyof typeof rateLimiters]) {
      res.status(400).json({
        error: 'Invalid rate limiter specified',
        available: Object.keys(rateLimiters),
      });
      return;
    }

    rateLimiters[limiter as keyof typeof rateLimiters].reset(key);

    logger.info('Rate limit reset via API', {
      limiter,
      key: key || 'all',
      adminUser: (req as any).user?.id,
    });

    res.json({
      message: 'Rate limit reset successfully',
      limiter,
      key: key || 'all',
    });
  } catch (error: any) {
    logger.error('Error resetting rate limit', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};
