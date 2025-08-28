/**
 * Monitoring Service
 * Comprehensive monitoring for banking connectors and system performance
 */

import { logger } from '@utils/logger';
import { EventEmitter } from 'events';
import { HealthCheckService } from './HealthCheckService';

export interface MonitoringConfig {
  metricsRetentionDays: number;
  alertingEnabled: boolean;
  performanceThresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  connectorHealthCheckInterval: number;
}

export interface ConnectorMetrics {
  connectorId: string;
  connectorName: string;
  status: 'connected' | 'disconnected' | 'error' | 'degraded';
  lastActivity: Date;
  connectionUptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastResponseTime: number;
  errorRate: number;
  throughput: number; // requests per minute
  lastError?: {
    message: string;
    timestamp: Date;
    code?: string;
  };
  performance: {
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
}

export interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  activeConnections: number;
  totalRequests: number;
  requestsPerMinute: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface Alert {
  id: string;
  type: 'connector_down' | 'high_error_rate' | 'slow_response' | 'high_memory' | 'high_cpu' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export class MonitoringService extends EventEmitter {
  private config: MonitoringConfig;
  private healthCheckService: HealthCheckService;
  private connectorMetrics: Map<string, ConnectorMetrics> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  private metricsCleanupInterval?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor(
    healthCheckService: HealthCheckService,
    config: Partial<MonitoringConfig> = {}
  ) {
    super();
    this.healthCheckService = healthCheckService;
    this.config = {
      metricsRetentionDays: 7,
      alertingEnabled: true,
      performanceThresholds: {
        responseTime: 5000, // 5 seconds
        errorRate: 0.05, // 5%
        throughput: 100, // 100 requests per minute
      },
      connectorHealthCheckInterval: 60000, // 1 minute
      ...config,
    };
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Monitoring Service...');

      // Set up health check listeners
      this.setupHealthCheckListeners();

      // Start monitoring
      this.start();

      // Set up metrics cleanup
      this.setupMetricsCleanup();

      logger.info('Monitoring Service initialized successfully');
      this.emit('initialized');

    } catch (error) {
      logger.error('Failed to initialize Monitoring Service', error);
      throw error;
    }
  }

  private setupHealthCheckListeners(): void {
    this.healthCheckService.on('healthChecksCompleted', (results) => {
      this.updateConnectorMetrics(results);
    });

    this.healthCheckService.on('alert', (alert) => {
      this.handleHealthCheckAlert(alert);
    });
  }

  private updateConnectorMetrics(healthCheckResults: any[]): void {
    healthCheckResults.forEach(result => {
      const connectorId = result.id;
      let metrics = this.connectorMetrics.get(connectorId);

      if (!metrics) {
        metrics = {
          connectorId,
          connectorName: result.name,
          status: 'disconnected',
          lastActivity: new Date(),
          connectionUptime: 0,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          lastResponseTime: 0,
          errorRate: 0,
          throughput: 0,
          performance: {
            p50ResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
          },
        };
      }

      // Update status based on health check result
      metrics.status = this.mapHealthStatusToConnectorStatus(result.status);
      metrics.lastActivity = result.timestamp;
      metrics.lastResponseTime = result.responseTime;

      // Update performance metrics
      this.updatePerformanceMetrics(connectorId, result.responseTime);

      // Calculate uptime
      if (metrics.status === 'connected') {
        metrics.connectionUptime = Date.now() - this.startTime;
      }

      // Store error information
      if (result.status === 'unhealthy' && result.details?.error) {
        metrics.lastError = {
          message: result.details.error,
          timestamp: result.timestamp,
          code: result.details.metadata?.errorCode,
        };
      }

      this.connectorMetrics.set(connectorId, metrics);
    });

    // Update system metrics
    this.updateSystemMetrics();
  }

  private mapHealthStatusToConnectorStatus(healthStatus: string): ConnectorMetrics['status'] {
    switch (healthStatus) {
      case 'healthy':
        return 'connected';
      case 'degraded':
        return 'degraded';
      case 'unhealthy':
        return 'error';
      default:
        return 'disconnected';
    }
  }

  private updatePerformanceMetrics(connectorId: string, responseTime: number): void {
    let responseTimes = this.responseTimes.get(connectorId) || [];
    responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (responseTimes.length > 1000) {
      responseTimes = responseTimes.slice(-1000);
    }

    this.responseTimes.set(connectorId, responseTimes);

    // Calculate percentiles
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const metrics = this.connectorMetrics.get(connectorId);

    if (metrics && sortedTimes.length > 0) {
      metrics.performance.p50ResponseTime = this.calculatePercentile(sortedTimes, 50);
      metrics.performance.p95ResponseTime = this.calculatePercentile(sortedTimes, 95);
      metrics.performance.p99ResponseTime = this.calculatePercentile(sortedTimes, 99);
      metrics.averageResponseTime = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    }
  }

  private calculatePercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  private updateSystemMetrics(): void {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const systemMetric: SystemMetrics = {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
      activeConnections: this.getActiveConnectionsCount(),
      totalRequests: this.getTotalRequestsCount(),
      requestsPerMinute: this.getRequestsPerMinute(),
      errorRate: this.getOverallErrorRate(),
      averageResponseTime: this.getOverallAverageResponseTime(),
    };

    this.systemMetrics.push(systemMetric);

    // Keep only last 24 hours of metrics (assuming 1 minute intervals)
    if (this.systemMetrics.length > 1440) {
      this.systemMetrics = this.systemMetrics.slice(-1440);
    }

    // Check for system-level alerts
    this.checkSystemAlerts(systemMetric);
  }

  private getActiveConnectionsCount(): number {
    return Array.from(this.connectorMetrics.values())
      .filter(metrics => metrics.status === 'connected').length;
  }

  private getTotalRequestsCount(): number {
    return Array.from(this.connectorMetrics.values())
      .reduce((total, metrics) => total + metrics.totalRequests, 0);
  }

  private getRequestsPerMinute(): number {
    // Calculate based on recent activity
    const recentMetrics = this.systemMetrics.slice(-5); // Last 5 minutes
    if (recentMetrics.length < 2) return 0;

    const oldestMetric = recentMetrics[0];
    const newestMetric = recentMetrics[recentMetrics.length - 1];
    const timeDiff = (newestMetric.timestamp.getTime() - oldestMetric.timestamp.getTime()) / 60000; // minutes
    const requestDiff = newestMetric.totalRequests - oldestMetric.totalRequests;

    return timeDiff > 0 ? requestDiff / timeDiff : 0;
  }

  private getOverallErrorRate(): number {
    const allMetrics = Array.from(this.connectorMetrics.values());
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalErrors = allMetrics.reduce((sum, m) => sum + m.failedRequests, 0);

    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }

  private getOverallAverageResponseTime(): number {
    const allMetrics = Array.from(this.connectorMetrics.values())
      .filter(m => m.averageResponseTime > 0);

    if (allMetrics.length === 0) return 0;

    return allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length;
  }

  private checkSystemAlerts(systemMetric: SystemMetrics): void {
    if (!this.config.alertingEnabled) return;

    // High memory usage alert
    if (systemMetric.memoryUsage.percentage > 85) {
      this.createAlert({
        type: 'high_memory',
        severity: systemMetric.memoryUsage.percentage > 95 ? 'critical' : 'high',
        title: 'High Memory Usage',
        message: `Memory usage is at ${systemMetric.memoryUsage.percentage.toFixed(1)}%`,
        source: 'system',
        metadata: {
          memoryUsage: systemMetric.memoryUsage,
        },
      });
    }

    // High CPU usage alert
    if (systemMetric.cpuUsage > 80) {
      this.createAlert({
        type: 'high_cpu',
        severity: systemMetric.cpuUsage > 95 ? 'critical' : 'high',
        title: 'High CPU Usage',
        message: `CPU usage is at ${systemMetric.cpuUsage.toFixed(1)}%`,
        source: 'system',
        metadata: {
          cpuUsage: systemMetric.cpuUsage,
        },
      });
    }

    // High error rate alert
    if (systemMetric.errorRate > this.config.performanceThresholds.errorRate) {
      this.createAlert({
        type: 'high_error_rate',
        severity: 'high',
        title: 'High Error Rate',
        message: `System error rate is ${(systemMetric.errorRate * 100).toFixed(2)}%`,
        source: 'system',
        metadata: {
          errorRate: systemMetric.errorRate,
          threshold: this.config.performanceThresholds.errorRate,
        },
      });
    }

    // Slow response time alert
    if (systemMetric.averageResponseTime > this.config.performanceThresholds.responseTime) {
      this.createAlert({
        type: 'slow_response',
        severity: 'medium',
        title: 'Slow Response Times',
        message: `Average response time is ${systemMetric.averageResponseTime.toFixed(0)}ms`,
        source: 'system',
        metadata: {
          averageResponseTime: systemMetric.averageResponseTime,
          threshold: this.config.performanceThresholds.responseTime,
        },
      });
    }
  }

  private handleHealthCheckAlert(healthCheckAlert: any): void {
    this.createAlert({
      type: 'connector_down',
      severity: 'high',
      title: `Connector Health Alert: ${healthCheckAlert.check.name}`,
      message: healthCheckAlert.details,
      source: healthCheckAlert.check.id,
      metadata: {
        checkType: healthCheckAlert.type,
        check: healthCheckAlert.check,
        result: healthCheckAlert.result,
      },
    });
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      ...alertData,
      id: alertId,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.set(alertId, alert);

    logger.warn('Alert created', {
      alertId,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      source: alert.source,
    });

    this.emit('alert', alert);
  }

  public recordConnectorRequest(connectorId: string, success: boolean, responseTime: number): void {
    let metrics = this.connectorMetrics.get(connectorId);
    if (!metrics) {
      // Create metrics if they don't exist
      metrics = {
        connectorId,
        connectorName: connectorId,
        status: 'connected',
        lastActivity: new Date(),
        connectionUptime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        performance: {
          p50ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
        },
      };
      this.connectorMetrics.set(connectorId, metrics);
    }

    // Update request metrics
    metrics.totalRequests++;
    metrics.lastActivity = new Date();
    metrics.lastResponseTime = responseTime;

    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    // Calculate error rate
    metrics.errorRate = metrics.failedRequests / metrics.totalRequests;

    // Update performance metrics
    this.updatePerformanceMetrics(connectorId, responseTime);

    // Calculate throughput (requests per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.getRecentRequestCount(connectorId, oneMinuteAgo);
    metrics.throughput = recentRequests;

    // Check for connector-specific alerts
    this.checkConnectorAlerts(metrics);
  }

  private getRecentRequestCount(connectorId: string, since: number): number {
    // This would typically query a time-series database
    // For now, we'll estimate based on current metrics
    const metrics = this.connectorMetrics.get(connectorId);
    if (!metrics) return 0;

    // Simple estimation - in a real implementation, you'd track request timestamps
    const timeSinceStart = Date.now() - this.startTime;
    const minutesSinceStart = timeSinceStart / 60000;
    return minutesSinceStart > 0 ? metrics.totalRequests / minutesSinceStart : 0;
  }

  private checkConnectorAlerts(metrics: ConnectorMetrics): void {
    if (!this.config.alertingEnabled) return;

    // High error rate for connector
    if (metrics.errorRate > this.config.performanceThresholds.errorRate && metrics.totalRequests > 10) {
      this.createAlert({
        type: 'high_error_rate',
        severity: 'high',
        title: `High Error Rate: ${metrics.connectorName}`,
        message: `Connector error rate is ${(metrics.errorRate * 100).toFixed(2)}%`,
        source: metrics.connectorId,
        metadata: {
          connectorId: metrics.connectorId,
          errorRate: metrics.errorRate,
          totalRequests: metrics.totalRequests,
          failedRequests: metrics.failedRequests,
        },
      });
    }

    // Slow response times for connector
    if (metrics.averageResponseTime > this.config.performanceThresholds.responseTime) {
      this.createAlert({
        type: 'slow_response',
        severity: 'medium',
        title: `Slow Response: ${metrics.connectorName}`,
        message: `Connector average response time is ${metrics.averageResponseTime.toFixed(0)}ms`,
        source: metrics.connectorId,
        metadata: {
          connectorId: metrics.connectorId,
          averageResponseTime: metrics.averageResponseTime,
          threshold: this.config.performanceThresholds.responseTime,
        },
      });
    }
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('Monitoring service already running');
      return;
    }

    this.isRunning = true;

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, this.config.connectorHealthCheckInterval);

    logger.info('Monitoring service started', {
      interval: this.config.connectorHealthCheckInterval,
      alertingEnabled: this.config.alertingEnabled,
    });

    this.emit('started');
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
      this.metricsCleanupInterval = undefined;
    }

    logger.info('Monitoring service stopped');
    this.emit('stopped');
  }

  private setupMetricsCleanup(): void {
    // Clean up old metrics daily
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);

    // Clean up system metrics
    this.systemMetrics = this.systemMetrics.filter(metric => metric.timestamp > cutoffDate);

    // Clean up resolved alerts older than retention period
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffDate) {
        this.alerts.delete(alertId);
      }
    }

    logger.info('Old metrics cleaned up', {
      retentionDays: this.config.metricsRetentionDays,
      systemMetricsCount: this.systemMetrics.length,
      alertsCount: this.alerts.size,
    });
  }

  // Public API methods
  public getConnectorMetrics(connectorId?: string): ConnectorMetrics | ConnectorMetrics[] {
    if (connectorId) {
      return this.connectorMetrics.get(connectorId) || null;
    }
    return Array.from(this.connectorMetrics.values());
  }

  public getSystemMetrics(limit = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  public getAlerts(resolved?: boolean): Alert[] {
    const alerts = Array.from(this.alerts.values());
    if (resolved !== undefined) {
      return alerts.filter(alert => alert.resolved === resolved);
    }
    return alerts;
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    logger.info('Alert resolved', { alertId, title: alert.title });
    this.emit('alertResolved', alert);

    return true;
  }

  public getConnectorHealth(): {
    totalConnectors: number;
    connectedConnectors: number;
    disconnectedConnectors: number;
    errorConnectors: number;
    degradedConnectors: number;
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const connectors = Array.from(this.connectorMetrics.values());
    const connected = connectors.filter(c => c.status === 'connected').length;
    const disconnected = connectors.filter(c => c.status === 'disconnected').length;
    const error = connectors.filter(c => c.status === 'error').length;
    const degraded = connectors.filter(c => c.status === 'degraded').length;

    let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (error > 0 || disconnected > connected) {
      overallHealth = 'unhealthy';
    } else if (degraded > 0) {
      overallHealth = 'degraded';
    }

    return {
      totalConnectors: connectors.length,
      connectedConnectors: connected,
      disconnectedConnectors: disconnected,
      errorConnectors: error,
      degradedConnectors: degraded,
      overallHealth,
    };
  }

  public getPerformanceMetrics(): {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  } {
    const latestSystemMetric = this.systemMetrics[this.systemMetrics.length - 1];

    return {
      averageResponseTime: latestSystemMetric?.averageResponseTime || 0,
      errorRate: latestSystemMetric?.errorRate || 0,
      throughput: latestSystemMetric?.requestsPerMinute || 0,
      uptime: Date.now() - this.startTime,
      memoryUsage: latestSystemMetric?.memoryUsage.percentage || 0,
      cpuUsage: latestSystemMetric?.cpuUsage || 0,
    };
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Monitoring Service...');

    this.stop();
    this.connectorMetrics.clear();
    this.systemMetrics = [];
    this.alerts.clear();
    this.responseTimes.clear();

    this.emit('shutdown');
    logger.info('Monitoring Service shutdown completed');
  }
}

export default MonitoringService;
