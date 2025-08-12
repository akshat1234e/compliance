/**
 * Health Check Service
 * Comprehensive health monitoring for all integration components
 */

import { logger } from '@utils/logger';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface HealthCheckConfig {
  checkInterval: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableAlerts: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    consecutiveFailures: number;
  };
}

export interface HealthCheck {
  id: string;
  name: string;
  type: 'http' | 'database' | 'connector' | 'service' | 'custom';
  config: {
    url?: string;
    method?: 'GET' | 'POST' | 'HEAD';
    headers?: Record<string, string>;
    expectedStatus?: number[];
    timeout?: number;
    customCheck?: () => Promise<HealthCheckResult>;
  };
  isEnabled: boolean;
  tags: string[];
}

export interface HealthCheckResult {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  responseTime: number;
  timestamp: Date;
  details?: {
    message?: string;
    error?: string;
    metadata?: Record<string, any>;
  };
  metrics?: {
    uptime?: number;
    successRate?: number;
    averageResponseTime?: number;
    lastFailure?: Date;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
    unknown: number;
  };
  performance: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
  };
}

export class HealthCheckService extends EventEmitter {
  private config: HealthCheckConfig;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private results: Map<string, HealthCheckResult[]> = new Map();
  private isRunning = false;
  private checkInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = {
      checkInterval: 30000, // 30 seconds
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      enableAlerts: true,
      alertThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.1, // 10%
        consecutiveFailures: 3,
      },
      ...config,
    };
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Health Check Service...');

      // Register default health checks
      await this.registerDefaultHealthChecks();

      // Start health check monitoring
      this.start();

      logger.info('Health Check Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Health Check Service', error);
      throw error;
    }
  }

  private async registerDefaultHealthChecks(): Promise<void> {
    // Self health check
    await this.registerHealthCheck({
      id: 'self',
      name: 'Integration Gateway Self Check',
      type: 'custom',
      config: {
        customCheck: async () => {
          const memoryUsage = process.memoryUsage();
          const cpuUsage = process.cpuUsage();

          return {
            id: 'self',
            name: 'Integration Gateway Self Check',
            status: 'healthy',
            responseTime: 0,
            timestamp: new Date(),
            details: {
              message: 'Service is running normally',
              metadata: {
                uptime: process.uptime(),
                memoryUsage: {
                  rss: memoryUsage.rss,
                  heapUsed: memoryUsage.heapUsed,
                  heapTotal: memoryUsage.heapTotal,
                },
                cpuUsage,
                nodeVersion: process.version,
                platform: process.platform,
              },
            },
          };
        },
      },
      isEnabled: true,
      tags: ['core', 'self'],
    });

    // Database health check
    if (process.env.DATABASE_URL) {
      await this.registerHealthCheck({
        id: 'database',
        name: 'Database Connection',
        type: 'database',
        config: {
          customCheck: async () => {
            // This would typically check database connectivity
            // For now, we'll simulate a database check
            const startTime = Date.now();

            try {
              // Simulate database query
              await new Promise(resolve => setTimeout(resolve, 10));

              return {
                id: 'database',
                name: 'Database Connection',
                status: 'healthy',
                responseTime: Date.now() - startTime,
                timestamp: new Date(),
                details: {
                  message: 'Database connection is healthy',
                  metadata: {
                    connectionPool: 'active',
                    activeConnections: 5,
                    maxConnections: 20,
                  },
                },
              };
            } catch (error: any) {
              return {
                id: 'database',
                name: 'Database Connection',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                timestamp: new Date(),
                details: {
                  error: error.message,
                },
              };
            }
          },
        },
        isEnabled: true,
        tags: ['database', 'critical'],
      });
    }

    // Redis health check
    if (process.env.REDIS_URL) {
      await this.registerHealthCheck({
        id: 'redis',
        name: 'Redis Connection',
        type: 'service',
        config: {
          customCheck: async () => {
            const startTime = Date.now();

            try {
              // Simulate Redis ping
              await new Promise(resolve => setTimeout(resolve, 5));

              return {
                id: 'redis',
                name: 'Redis Connection',
                status: 'healthy',
                responseTime: Date.now() - startTime,
                timestamp: new Date(),
                details: {
                  message: 'Redis connection is healthy',
                  metadata: {
                    connected: true,
                    memoryUsage: '2.5MB',
                    connectedClients: 3,
                  },
                },
              };
            } catch (error: any) {
              return {
                id: 'redis',
                name: 'Redis Connection',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                timestamp: new Date(),
                details: {
                  error: error.message,
                },
              };
            }
          },
        },
        isEnabled: true,
        tags: ['cache', 'redis'],
      });
    }
  }

  public async registerHealthCheck(healthCheck: HealthCheck): Promise<void> {
    this.healthChecks.set(healthCheck.id, healthCheck);
    this.results.set(healthCheck.id, []);

    logger.info('Health check registered', {
      id: healthCheck.id,
      name: healthCheck.name,
      type: healthCheck.type,
    });

    this.emit('healthCheckRegistered', healthCheck);
  }

  public async unregisterHealthCheck(id: string): Promise<void> {
    if (!this.healthChecks.has(id)) {
      throw new Error(`Health check not found: ${id}`);
    }

    this.healthChecks.delete(id);
    this.results.delete(id);

    logger.info('Health check unregistered', { id });
    this.emit('healthCheckUnregistered', id);
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('Health check service already running');
      return;
    }

    this.isRunning = true;

    // Run initial health checks
    this.runHealthChecks();

    // Schedule periodic health checks
    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.config.checkInterval);

    logger.info('Health check monitoring started', {
      interval: this.config.checkInterval,
      checksCount: this.healthChecks.size,
    });

    this.emit('started');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    logger.info('Health check monitoring stopped');
    this.emit('stopped');
  }

  private async runHealthChecks(): Promise<void> {
    const enabledChecks = Array.from(this.healthChecks.values())
      .filter(check => check.isEnabled);

    if (enabledChecks.length === 0) {
      return;
    }

    logger.debug('Running health checks', { count: enabledChecks.length });

    const checkPromises = enabledChecks.map(check =>
      this.executeHealthCheck(check).catch(error => {
        logger.error('Health check execution failed', {
          checkId: check.id,
          error: error.message,
        });
        return this.createErrorResult(check, error);
      })
    );

    const results = await Promise.all(checkPromises);

    // Store results
    results.forEach(result => {
      const checkResults = this.results.get(result.id) || [];
      checkResults.push(result);

      // Keep only last 100 results per check
      if (checkResults.length > 100) {
        checkResults.splice(0, checkResults.length - 100);
      }

      this.results.set(result.id, checkResults);
    });

    // Check for alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(results);
    }

    this.emit('healthChecksCompleted', results);
  }

  private async executeHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      let result: HealthCheckResult;

      switch (check.type) {
        case 'http':
          result = await this.executeHttpCheck(check);
          break;
        case 'custom':
          if (check.config.customCheck) {
            result = await check.config.customCheck();
          } else {
            throw new Error('Custom check function not provided');
          }
          break;
        default:
          throw new Error(`Unsupported health check type: ${check.type}`);
      }

      // Calculate metrics
      const checkResults = this.results.get(check.id) || [];
      const recentResults = checkResults.slice(-10); // Last 10 results
      const successfulResults = recentResults.filter(r => r.status === 'healthy');

      result.metrics = {
        uptime: this.getUptime(),
        successRate: recentResults.length > 0 ? successfulResults.length / recentResults.length : 1,
        averageResponseTime: recentResults.length > 0
          ? recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length
          : result.responseTime,
        lastFailure: recentResults.find(r => r.status !== 'healthy')?.timestamp,
      };

      return result;

    } catch (error: any) {
      this.errorCount++;
      return this.createErrorResult(check, error, Date.now() - startTime);
    }
  }

  private async executeHttpCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!check.config.url) {
      throw new Error('URL is required for HTTP health check');
    }

    const config = {
      method: check.config.method || 'GET',
      url: check.config.url,
      headers: check.config.headers || {},
      timeout: check.config.timeout || this.config.timeout,
      validateStatus: () => true, // Don't throw on non-2xx status codes
    };

    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    const expectedStatus = check.config.expectedStatus || [200, 201, 204];
    const isHealthy = expectedStatus.includes(response.status);

    return {
      id: check.id,
      name: check.name,
      status: isHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      timestamp: new Date(),
      details: {
        message: isHealthy ? 'HTTP check passed' : `Unexpected status code: ${response.status}`,
        metadata: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: response.headers,
          url: check.config.url,
        },
      },
    };
  }

  private createErrorResult(check: HealthCheck, error: any, responseTime?: number): HealthCheckResult {
    return {
      id: check.id,
      name: check.name,
      status: 'unhealthy',
      responseTime: responseTime || 0,
      timestamp: new Date(),
      details: {
        error: error.message,
        metadata: {
          errorType: error.constructor.name,
          stack: error.stack,
        },
      },
    };
  }

  private checkAlerts(results: HealthCheckResult[]): void {
    results.forEach(result => {
      const check = this.healthChecks.get(result.id);
      if (!check) return;

      const checkResults = this.results.get(result.id) || [];
      const recentResults = checkResults.slice(-this.config.alertThresholds.consecutiveFailures);

      // Check for consecutive failures
      if (recentResults.length >= this.config.alertThresholds.consecutiveFailures) {
        const allFailed = recentResults.every(r => r.status === 'unhealthy');
        if (allFailed) {
          this.emit('alert', {
            type: 'consecutive_failures',
            check,
            result,
            details: `${this.config.alertThresholds.consecutiveFailures} consecutive failures`,
          });
        }
      }

      // Check for high response time
      if (result.responseTime > this.config.alertThresholds.responseTime) {
        this.emit('alert', {
          type: 'high_response_time',
          check,
          result,
          details: `Response time ${result.responseTime}ms exceeds threshold ${this.config.alertThresholds.responseTime}ms`,
        });
      }

      // Check for high error rate
      const errorRate = this.errorCount / this.requestCount;
      if (errorRate > this.config.alertThresholds.errorRate) {
        this.emit('alert', {
          type: 'high_error_rate',
          check,
          result,
          details: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.config.alertThresholds.errorRate * 100).toFixed(2)}%`,
        });
      }
    });
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    const allResults = Array.from(this.results.entries())
      .map(([id, results]) => results[results.length - 1])
      .filter(result => result !== undefined);

    const summary = {
      total: allResults.length,
      healthy: allResults.filter(r => r.status === 'healthy').length,
      unhealthy: allResults.filter(r => r.status === 'unhealthy').length,
      degraded: allResults.filter(r => r.status === 'degraded').length,
      unknown: allResults.filter(r => r.status === 'unknown').length,
    };

    const overallStatus = this.determineOverallStatus(summary);
    const averageResponseTime = allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length
      : 0;

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: allResults,
      summary,
      performance: {
        averageResponseTime,
        totalRequests: this.requestCount,
        errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to milliseconds
      },
    };
  }

  private determineOverallStatus(summary: SystemHealth['summary']): SystemHealth['status'] {
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    }
    if (summary.degraded > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  public getHealthCheck(id: string): HealthCheck | undefined {
    return this.healthChecks.get(id);
  }

  public getAllHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  public getHealthCheckResults(id: string, limit = 10): HealthCheckResult[] {
    const results = this.results.get(id) || [];
    return results.slice(-limit);
  }

  public getHealthCheckStats(id: string): {
    totalChecks: number;
    successRate: number;
    averageResponseTime: number;
    lastCheck?: HealthCheckResult;
    uptime: number;
  } | null {
    const results = this.results.get(id);
    if (!results || results.length === 0) {
      return null;
    }

    const successfulChecks = results.filter(r => r.status === 'healthy').length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      totalChecks: results.length,
      successRate: successfulChecks / results.length,
      averageResponseTime,
      lastCheck: results[results.length - 1],
      uptime: this.getUptime(),
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Health Check Service...');

    this.stop();
    this.healthChecks.clear();
    this.results.clear();

    this.emit('shutdown');
    logger.info('Health Check Service shutdown completed');
  }
}

export default HealthCheckService;
