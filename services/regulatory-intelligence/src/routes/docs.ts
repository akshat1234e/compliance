/**
 * API Documentation routes for Regulatory Intelligence Service
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Serve API documentation
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('API documentation requested', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regulatory Intelligence Service API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #1f4e79;
        }
        .swagger-ui .topbar .download-url-wrapper .select-label {
            color: #fff;
        }
        .swagger-ui .topbar .download-url-wrapper input[type=text] {
            border: 2px solid #547ca3;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/v1/docs/openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                docExpansion: "list",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                displayRequestDuration: true,
                tryItOutEnabled: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded successfully');
                }
            });
        };
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
}));

/**
 * Serve OpenAPI specification as JSON
 */
router.get('/openapi.json', asyncHandler(async (req: Request, res: Response) => {
  logger.info('OpenAPI JSON specification requested', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Return a basic OpenAPI specification
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Regulatory Intelligence Service API',
      description: 'Comprehensive REST API for regulatory compliance management',
      version: '1.0.0',
      contact: {
        name: 'Compliance Platform Support',
        email: 'support@compliance-platform.com'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Basic health check',
          responses: {
            '200': {
              description: 'Service is healthy'
            }
          }
        }
      },
      '/regulations': {
        get: {
          tags: ['Regulations'],
          summary: 'List regulations',
          responses: {
            '200': {
              description: 'List of regulations'
            }
          }
        }
      }
    }
  };

  res.json(openApiSpec);
}));

/**
 * Serve OpenAPI specification as YAML
 */
router.get('/openapi.yaml', asyncHandler(async (req: Request, res: Response) => {
  logger.info('OpenAPI YAML specification requested', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Return basic YAML content
  const yamlContent = `
openapi: 3.0.3
info:
  title: Regulatory Intelligence Service API
  description: Comprehensive REST API for regulatory compliance management
  version: 1.0.0
servers:
  - url: /api/v1
    description: API v1
paths:
  /health:
    get:
      tags: [Health]
      summary: Basic health check
      responses:
        '200':
          description: Service is healthy
  /regulations:
    get:
      tags: [Regulations]
      summary: List regulations
      responses:
        '200':
          description: List of regulations
`;

  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(yamlContent);
}));

/**
 * API endpoints summary
 */
router.get('/endpoints', asyncHandler(async (req: Request, res: Response) => {
  logger.info('API endpoints summary requested', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  const endpoints = {
    regulations: {
      baseUrl: '/api/v1/regulations',
      endpoints: [
        {
          method: 'GET',
          path: '/',
          description: 'List regulations with pagination and filtering',
          auth: 'Required',
          permissions: ['regulations:read', 'admin']
        },
        {
          method: 'GET',
          path: '/:id',
          description: 'Get specific regulation details',
          auth: 'Required',
          permissions: ['regulations:read', 'admin']
        },
        {
          method: 'POST',
          path: '/search',
          description: 'Full-text search regulations',
          auth: 'Required',
          permissions: ['regulations:read', 'admin']
        },
        {
          method: 'GET',
          path: '/:id/requirements',
          description: 'Get compliance requirements for regulation',
          auth: 'Required',
          permissions: ['regulations:read', 'compliance:read', 'admin']
        },
        {
          method: 'GET',
          path: '/:id/timeline',
          description: 'Get regulatory timeline and deadlines',
          auth: 'Required',
          permissions: ['regulations:read', 'timeline:read', 'admin']
        }
      ]
    },
    scraper: {
      baseUrl: '/api/v1/scraper',
      endpoints: [
        {
          method: 'POST',
          path: '/scrape',
          description: 'Trigger manual scraping',
          auth: 'Required',
          permissions: ['scraper:execute', 'admin']
        },
        {
          method: 'GET',
          path: '/status',
          description: 'Get scraping status and statistics',
          auth: 'Required',
          permissions: ['scraper:read', 'admin']
        },
        {
          method: 'POST',
          path: '/download',
          description: 'Download specific circular content',
          auth: 'Required',
          permissions: ['scraper:execute', 'admin']
        },
        {
          method: 'GET',
          path: '/test',
          description: 'Test scraping connectivity',
          auth: 'Required',
          permissions: ['scraper:read', 'admin']
        },
        {
          method: 'POST',
          path: '/reset-stats',
          description: 'Reset scraping statistics',
          auth: 'Required',
          permissions: ['admin']
        }
      ]
    },
    parser: {
      baseUrl: '/api/v1/parser',
      endpoints: [
        {
          method: 'POST',
          path: '/parse',
          description: 'Parse single circular',
          auth: 'Required',
          permissions: ['parser:execute', 'admin']
        },
        {
          method: 'POST',
          path: '/parse/batch',
          description: 'Parse multiple circulars (max 10)',
          auth: 'Required',
          permissions: ['parser:execute', 'admin']
        },
        {
          method: 'POST',
          path: '/extract',
          description: 'Extract specific elements',
          auth: 'Required',
          permissions: ['parser:execute', 'admin']
        },
        {
          method: 'POST',
          path: '/analyze',
          description: 'Analyze content only',
          auth: 'Required',
          permissions: ['parser:execute', 'admin']
        }
      ]
    },
    impact: {
      baseUrl: '/api/v1/impact',
      endpoints: [
        {
          method: 'POST',
          path: '/analyze',
          description: 'Perform AI-powered impact analysis',
          auth: 'Required',
          permissions: ['impact:analyze', 'admin']
        },
        {
          method: 'GET',
          path: '/:assessmentId',
          description: 'Get impact assessment results',
          auth: 'Required',
          permissions: ['impact:read', 'admin']
        },
        {
          method: 'GET',
          path: '/summary/:organizationId',
          description: 'Get organization impact summary',
          auth: 'Required',
          permissions: ['impact:read', 'admin']
        },
        {
          method: 'POST',
          path: '/compare',
          description: 'Compare multiple impact assessments',
          auth: 'Required',
          permissions: ['impact:analyze', 'admin']
        },
        {
          method: 'POST',
          path: '/cache/clear',
          description: 'Clear assessment cache',
          auth: 'Required',
          permissions: ['admin']
        }
      ]
    },
    notifications: {
      baseUrl: '/api/v1/notifications',
      endpoints: [
        {
          method: 'POST',
          path: '/send',
          description: 'Send custom notification',
          auth: 'Required',
          permissions: ['notifications:send', 'admin']
        },
        {
          method: 'POST',
          path: '/regulatory-change',
          description: 'Send regulatory change alert',
          auth: 'Required',
          permissions: ['notifications:send', 'admin', 'regulatory:notify']
        },
        {
          method: 'POST',
          path: '/compliance-deadline',
          description: 'Send deadline notification',
          auth: 'Required',
          permissions: ['notifications:send', 'admin', 'compliance:notify']
        },
        {
          method: 'POST',
          path: '/risk-alert',
          description: 'Send risk alert',
          auth: 'Required',
          permissions: ['notifications:send', 'admin', 'risk:notify']
        },
        {
          method: 'GET',
          path: '/result/:notificationId',
          description: 'Get notification status',
          auth: 'Required',
          permissions: ['notifications:read', 'admin']
        },
        {
          method: 'GET',
          path: '/stats',
          description: 'Get notification statistics',
          auth: 'Required',
          permissions: ['notifications:read', 'admin']
        },
        {
          method: 'POST',
          path: '/process-scheduled',
          description: 'Process scheduled notifications',
          auth: 'Required',
          permissions: ['admin', 'system']
        },
        {
          method: 'POST',
          path: '/clear-history',
          description: 'Clear notification history',
          auth: 'Required',
          permissions: ['admin']
        }
      ]
    },
    timeline: {
      baseUrl: '/api/v1/timeline',
      endpoints: [
        {
          method: 'POST',
          path: '/generate',
          description: 'Generate timeline from circular',
          auth: 'Required',
          permissions: ['regulations:read', 'timeline:create', 'admin']
        },
        {
          method: 'GET',
          path: '/:timelineId',
          description: 'Get timeline mapping',
          auth: 'Required',
          permissions: ['regulations:read', 'timeline:read', 'admin']
        },
        {
          method: 'PATCH',
          path: '/:timelineId/events/:eventId/status',
          description: 'Update event status',
          auth: 'Required',
          permissions: ['timeline:write', 'admin']
        },
        {
          method: 'GET',
          path: '/stats/overview',
          description: 'Get timeline statistics',
          auth: 'Required',
          permissions: ['timeline:read', 'admin']
        },
        {
          method: 'GET',
          path: '/organization/:organizationId',
          description: 'Get organization timeline',
          auth: 'Required',
          permissions: ['regulations:read', 'timeline:read', 'admin']
        },
        {
          method: 'POST',
          path: '/cache/clear',
          description: 'Clear timeline cache',
          auth: 'Required',
          permissions: ['admin']
        }
      ]
    },
    health: {
      baseUrl: '/api/v1/health',
      endpoints: [
        {
          method: 'GET',
          path: '/',
          description: 'Basic health check',
          auth: 'None',
          permissions: []
        },
        {
          method: 'GET',
          path: '/detailed',
          description: 'Detailed health status',
          auth: 'Required',
          permissions: ['health:read', 'admin']
        },
        {
          method: 'GET',
          path: '/ready',
          description: 'Readiness probe',
          auth: 'None',
          permissions: []
        },
        {
          method: 'GET',
          path: '/live',
          description: 'Liveness probe',
          auth: 'None',
          permissions: []
        }
      ]
    }
  };

  res.json({
    success: true,
    data: {
      totalEndpoints: Object.values(endpoints).reduce((sum, service) => sum + service.endpoints.length, 0),
      services: Object.keys(endpoints).length,
      endpoints,
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        tokenExpiry: '24 hours'
      },
      rateLimit: {
        default: '100 requests per minute',
        scraping: '10 requests per minute',
        analysis: '20 requests per minute',
        admin: '50 requests per minute'
      }
    },
    timestamp: new Date().toISOString(),
  });
}));

export default router;
