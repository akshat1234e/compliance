/**
 * Comprehensive API Endpoints Test Suite
 * Tests all REST API endpoints for the Regulatory Intelligence Service
 */

import request from 'supertest';
import { Express } from 'express';
import RegulatoryIntelligenceService from '../index';

describe('Regulatory Intelligence Service - API Endpoints', () => {
  let app: Express;
  let service: RegulatoryIntelligenceService;

  beforeAll(async () => {
    service = new RegulatoryIntelligenceService();
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('Health Endpoints', () => {
    describe('GET /api/v1/health', () => {
      it('should return basic health status', async () => {
        const response = await request(app)
          .get('/api/v1/health')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('uptime');
        expect(response.body.data).toHaveProperty('version');
      });
    });

    describe('GET /api/v1/health/ready', () => {
      it('should return readiness status', async () => {
        const response = await request(app)
          .get('/api/v1/health/ready')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('ready');
      });
    });

    describe('GET /api/v1/health/live', () => {
      it('should return liveness status', async () => {
        const response = await request(app)
          .get('/api/v1/health/live')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('alive', true);
      });
    });
  });

  describe('Documentation Endpoints', () => {
    describe('GET /api/v1/docs', () => {
      it('should serve API documentation HTML', async () => {
        const response = await request(app)
          .get('/api/v1/docs')
          .expect(200);

        expect(response.headers['content-type']).toContain('text/html');
        expect(response.text).toContain('Swagger UI');
        expect(response.text).toContain('Regulatory Intelligence Service API Documentation');
      });
    });

    describe('GET /api/v1/docs/endpoints', () => {
      it('should return API endpoints summary', async () => {
        const response = await request(app)
          .get('/api/v1/docs/endpoints')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('totalEndpoints');
        expect(response.body.data).toHaveProperty('services');
        expect(response.body.data).toHaveProperty('endpoints');
        expect(response.body.data.endpoints).toHaveProperty('regulations');
        expect(response.body.data.endpoints).toHaveProperty('scraper');
        expect(response.body.data.endpoints).toHaveProperty('parser');
        expect(response.body.data.endpoints).toHaveProperty('notifications');
        expect(response.body.data.endpoints).toHaveProperty('timeline');
        expect(response.body.data.endpoints).toHaveProperty('health');
      });
    });

    describe('GET /api/v1/docs/openapi.json', () => {
      it('should return OpenAPI specification as JSON', async () => {
        const response = await request(app)
          .get('/api/v1/docs/openapi.json')
          .expect(200);

        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toHaveProperty('openapi');
        expect(response.body).toHaveProperty('info');
        expect(response.body).toHaveProperty('paths');
        expect(response.body).toHaveProperty('components');
      });
    });
  });

  describe('Regulations Endpoints (Mock Auth)', () => {
    const mockAuthHeader = 'Bearer mock-jwt-token';

    describe('GET /api/v1/regulations', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/v1/regulations')
          .expect(401);
      });

      it('should return regulations list with valid auth', async () => {
        const response = await request(app)
          .get('/api/v1/regulations')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/regulations?page=1&limit=10')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 10);
      });

      it('should support filtering parameters', async () => {
        const response = await request(app)
          .get('/api/v1/regulations?category=Capital%20Adequacy&impactLevel=high')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.metadata.filters).toHaveProperty('category', 'Capital Adequacy');
        expect(response.body.metadata.filters).toHaveProperty('impactLevel', 'high');
      });
    });

    describe('GET /api/v1/regulations/:id', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/v1/regulations/reg-001')
          .expect(401);
      });

      it('should return regulation details with valid auth', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/reg-001')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('category');
      });

      it('should return 404 for non-existent regulation', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/non-existent')
          .set('Authorization', mockAuthHeader)
          .expect(404);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'Regulation not found');
      });
    });

    describe('POST /api/v1/regulations/search', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/v1/regulations/search')
          .send({ query: 'capital adequacy' })
          .expect(401);
      });

      it('should perform search with valid request', async () => {
        const searchRequest = {
          query: 'capital adequacy',
          filters: {
            category: 'Capital Adequacy',
            impactLevel: 'high'
          },
          page: 1,
          limit: 20
        };

        const response = await request(app)
          .post('/api/v1/regulations/search')
          .set('Authorization', mockAuthHeader)
          .send(searchRequest)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('results');
        expect(response.body.data).toHaveProperty('totalResults');
        expect(response.body.data).toHaveProperty('query', 'capital adequacy');
        expect(Array.isArray(response.body.data.results)).toBe(true);
      });

      it('should validate search request', async () => {
        const invalidRequest = {
          // Missing required query field
          filters: {}
        };

        const response = await request(app)
          .post('/api/v1/regulations/search')
          .set('Authorization', mockAuthHeader)
          .send(invalidRequest)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/v1/regulations/:id/requirements', () => {
      it('should return regulation requirements', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/reg-001/requirements')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('regulationId', 'reg-001');
        expect(response.body.data).toHaveProperty('requirements');
        expect(response.body.data).toHaveProperty('summary');
        expect(Array.isArray(response.body.data.requirements)).toBe(true);
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/reg-001/requirements?status=pending')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/v1/regulations/:id/timeline', () => {
      it('should return regulation timeline', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/reg-001/timeline')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('regulationId', 'reg-001');
        expect(response.body.data).toHaveProperty('deadlines');
        expect(response.body.data).toHaveProperty('summary');
        expect(Array.isArray(response.body.data.deadlines)).toBe(true);
      });

      it('should support timeframe parameter', async () => {
        const response = await request(app)
          .get('/api/v1/regulations/reg-001/timeline?timeframe=6m')
          .set('Authorization', mockAuthHeader)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('timeframe', '6m');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/regulations/search')
        .set('Authorization', 'Bearer mock-token')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-endpoint')
        .expect(404);

      expect(response.body.metadata).toHaveProperty('requestId');
      expect(response.body.metadata).toHaveProperty('timestamp');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      // Rate limiting headers should be present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/v1/regulations')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('Response Format Consistency', () => {
    it('should have consistent success response format', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should have consistent error response format', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('requestId');
      expect(response.body.metadata).toHaveProperty('timestamp');
    });
  });

  describe('Content Type Handling', () => {
    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/v1/regulations/search')
        .set('Authorization', 'Bearer mock-token')
        .set('Content-Type', 'application/json')
        .send({ query: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
