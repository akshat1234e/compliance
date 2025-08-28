/**
 * Health check tests for Regulatory Intelligence Service
 */

import request from 'supertest';
import express from 'express';
import healthRoutes from '../routes/health';

describe('Health Check Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('checks');

      expect(response.body.service).toBe('regulatory-intelligence');
      expect(['healthy', 'unhealthy', 'degraded']).toContain(response.body.status);
    });

    it('should include memory check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks.memory).toHaveProperty('status');
      expect(['pass', 'fail', 'warn']).toContain(response.body.checks.memory.status);
    });

    it('should include CPU check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.checks).toHaveProperty('cpu');
      expect(response.body.checks.cpu).toHaveProperty('status');
      expect(['pass', 'fail', 'warn']).toContain(response.body.checks.cpu.status);
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'regulatory-intelligence');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('service', 'regulatory-intelligence');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('memory');
      
      // Should have database checks (even if mocked)
      expect(response.body.checks).toHaveProperty('postgresql');
      expect(response.body.checks).toHaveProperty('mongodb');
      expect(response.body.checks).toHaveProperty('redis');
      expect(response.body.checks).toHaveProperty('elasticsearch');
    });
  });
});
