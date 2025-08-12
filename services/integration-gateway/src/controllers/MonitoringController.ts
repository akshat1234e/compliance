/**
 * Monitoring Controller
 * HTTP endpoints for monitoring and health check management
 */

import { Request, Response } from 'express';
import { HealthCheckService } from '../services/HealthCheckService';
import { MonitoringService } from '../services/MonitoringService';
import logger from '../utils/logger';

export class MonitoringController {
  private healthCheckService: HealthCheckService;
  private monitoringService: MonitoringService;

  constructor(
    healthCheckService: HealthCheckService,
    monitoringService: MonitoringService
  ) {
    this.healthCheckService = healthCheckService;
    this.monitoringService = monitoringService;
  }

  // Health Check Endpoints
  public getSystemHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const systemHealth = await this.healthCheckService.getSystemHealth();
      
      // Set appropriate HTTP status based on health
      let statusCode = 200;
      if (systemHealth.status === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      } else if (systemHealth.status === 'degraded') {
        statusCode = 200; // OK but with warnings
      }

      res.status(statusCode).json(systemHealth);
    } catch (error: any) {
      logger.error('Error getting system health', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getHealthChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthChecks = this.healthCheckService.getAllHealthChecks();
      
      res.json({
        healthChecks: healthChecks.map(check => ({
          ...check,
          // Don't expose sensitive configuration
          config: {
            ...check.config,
            customCheck: check.config.customCheck ? '[Function]' : undefined,
          },
        })),
        total: healthChecks.length,
      });
    } catch (error: any) {
      logger.error('Error getting health checks', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const healthCheck = this.healthCheckService.getHealthCheck(id);

      if (!healthCheck) {
        res.status(404).json({
          error: 'Health check not found',
        });
        return;
      }

      const stats = this.healthCheckService.getHealthCheckStats(id);
      const recentResults = this.healthCheckService.getHealthCheckResults(id, 10);

      res.json({
        healthCheck: {
          ...healthCheck,
          config: {
            ...healthCheck.config,
            customCheck: healthCheck.config.customCheck ? '[Function]' : undefined,
          },
        },
        stats,
        recentResults,
      });
    } catch (error: any) {
      logger.error('Error getting health check', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public createHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        id,
        name,
        type,
        config,
        isEnabled = true,
        tags = [],
      } = req.body;

      // Validation
      if (!id || !name || !type) {
        res.status(400).json({
          error: 'Missing required fields: id, name, type',
        });
        return;
      }

      if (!['http', 'database', 'connector', 'service', 'custom'].includes(type)) {
        res.status(400).json({
          error: 'Invalid health check type',
        });
        return;
      }

      // Validate HTTP health check configuration
      if (type === 'http' && !config?.url) {
        res.status(400).json({
          error: 'URL is required for HTTP health checks',
        });
        return;
      }

      await this.healthCheckService.registerHealthCheck({
        id,
        name,
        type,
        config: config || {},
        isEnabled,
        tags,
      });

      logger.info('Health check created via API', {
        id,
        name,
        type,
      });

      res.status(201).json({
        message: 'Health check created successfully',
        id,
      });
    } catch (error: any) {
      logger.error('Error creating health check', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public deleteHealthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.healthCheckService.unregisterHealthCheck(id);

      logger.info('Health check deleted via API', { id });

      res.json({
        message: 'Health check deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Health check not found',
        });
      } else {
        logger.error('Error deleting health check', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  };

  // Monitoring Endpoints
  public getConnectorMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { connectorId } = req.params;
      
      if (connectorId) {
        const metrics = this.monitoringService.getConnectorMetrics(connectorId);
        if (!metrics) {
          res.status(404).json({
            error: 'Connector not found',
          });
          return;
        }
        res.json(metrics);
      } else {
        const allMetrics = this.monitoringService.getConnectorMetrics();
        res.json({
          connectors: allMetrics,
          total: Array.isArray(allMetrics) ? allMetrics.length : 0,
        });
      }
    } catch (error: any) {
      logger.error('Error getting connector metrics', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getSystemMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = 100 } = req.query;
      const metrics = this.monitoringService.getSystemMetrics(parseInt(limit as string));
      
      res.json({
        metrics,
        total: metrics.length,
      });
    } catch (error: any) {
      logger.error('Error getting system metrics', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resolved } = req.query;
      let resolvedFilter: boolean | undefined;
      
      if (resolved === 'true') resolvedFilter = true;
      else if (resolved === 'false') resolvedFilter = false;
      
      const alerts = this.monitoringService.getAlerts(resolvedFilter);
      
      res.json({
        alerts,
        total: alerts.length,
      });
    } catch (error: any) {
      logger.error('Error getting alerts', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public resolveAlert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { alertId } = req.params;
      
      const resolved = this.monitoringService.resolveAlert(alertId);
      
      if (!resolved) {
        res.status(404).json({
          error: 'Alert not found or already resolved',
        });
        return;
      }

      logger.info('Alert resolved via API', { alertId });

      res.json({
        message: 'Alert resolved successfully',
      });
    } catch (error: any) {
      logger.error('Error resolving alert', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getConnectorHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const connectorHealth = this.monitoringService.getConnectorHealth();
      res.json(connectorHealth);
    } catch (error: any) {
      logger.error('Error getting connector health', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  public getPerformanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const performanceMetrics = this.monitoringService.getPerformanceMetrics();
      res.json(performanceMetrics);
    } catch (error: any) {
      logger.error('Error getting performance metrics', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  // Dashboard Summary Endpoint
  public getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const [
        systemHealth,
        connectorHealth,
        performanceMetrics,
        recentAlerts,
      ] = await Promise.all([
        this.healthCheckService.getSystemHealth(),
        this.monitoringService.getConnectorHealth(),
        this.monitoringService.getPerformanceMetrics(),
        this.monitoringService.getAlerts(false), // Only unresolved alerts
      ]);

      const summary = {
        timestamp: new Date().toISOString(),
        system: {
          status: systemHealth.status,
          uptime: systemHealth.uptime,
          version: systemHealth.version,
          environment: systemHealth.environment,
        },
        connectors: connectorHealth,
        performance: performanceMetrics,
        alerts: {
          total: recentAlerts.length,
          critical: recentAlerts.filter(a => a.severity === 'critical').length,
          high: recentAlerts.filter(a => a.severity === 'high').length,
          medium: recentAlerts.filter(a => a.severity === 'medium').length,
          low: recentAlerts.filter(a => a.severity === 'low').length,
        },
        healthChecks: {
          total: systemHealth.summary.total,
          healthy: systemHealth.summary.healthy,
          unhealthy: systemHealth.summary.unhealthy,
          degraded: systemHealth.summary.degraded,
        },
      };

      res.json(summary);
    } catch (error: any) {
      logger.error('Error getting dashboard summary', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };

  // Utility Endpoints
  public recordConnectorRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { connectorId, success, responseTime } = req.body;

      if (!connectorId || success === undefined || responseTime === undefined) {
        res.status(400).json({
          error: 'Missing required fields: connectorId, success, responseTime',
        });
        return;
      }

      this.monitoringService.recordConnectorRequest(
        connectorId,
        Boolean(success),
        Number(responseTime)
      );

      res.json({
        message: 'Connector request recorded successfully',
      });
    } catch (error: any) {
      logger.error('Error recording connector request', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  };
}

export default MonitoringController;
