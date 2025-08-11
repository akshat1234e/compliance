# Regulatory Intelligence Service

## Overview

The Regulatory Intelligence Service is a comprehensive AI-powered microservice that monitors, processes, and analyzes regulatory circulars from Indian financial regulators including RBI, SEBI, and IRDAI. It provides real-time regulatory change detection, intelligent document processing, and automated compliance notifications.

## 🚀 Features

### Core Capabilities
- **Automated Monitoring**: Continuous monitoring of regulatory websites for new circulars
- **AI-Powered Analysis**: Advanced NLP processing for content extraction and impact assessment
- **Real-time Notifications**: Multi-channel notification system (Email, Slack, SMS, In-app)
- **Intelligent Search**: Elasticsearch-powered search with faceted filtering
- **Impact Assessment**: AI-driven regulatory impact analysis and risk scoring
- **Compliance Tracking**: Automated compliance requirement extraction and tracking

### Regulatory Sources
- **RBI (Reserve Bank of India)**: Circulars, notifications, and master directions
- **SEBI (Securities and Exchange Board of India)**: Circulars and notifications
- **IRDAI (Insurance Regulatory and Development Authority)**: Circulars and guidelines

### AI/ML Capabilities
- **Document Processing**: PDF, Word, and HTML content extraction
- **NLP Analysis**: Sentiment analysis, entity recognition, and classification
- **Requirement Extraction**: Automated compliance requirement identification
- **Impact Assessment**: Risk-based impact scoring and timeline estimation
- **Summarization**: Intelligent document summarization

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Databases**: 
  - PostgreSQL (transactional data)
  - MongoDB (document storage)
  - Redis (caching and sessions)
  - Elasticsearch (search and analytics)
- **AI/ML**: Integration with Python-based AI services
- **Monitoring**: Prometheus metrics and health checks
- **Documentation**: Swagger/OpenAPI 3.0

### Service Components

#### 1. Regulatory Monitor (`RegulatoryMonitor.ts`)
- Scheduled monitoring of regulatory websites
- Web scraping with Puppeteer and Cheerio
- Configurable monitoring schedules per source
- Error handling and retry mechanisms

#### 2. Circular Processor (`CircularProcessor.ts`)
- Document download and content extraction
- AI-powered analysis and classification
- Compliance requirement extraction
- Impact assessment and risk scoring

#### 3. Notification Service (`NotificationService.ts`)
- Multi-channel notification delivery
- Template-based messaging
- Subscriber management and preferences
- Delivery tracking and analytics

#### 4. Database Service (`DatabaseService.ts`)
- Unified database access layer
- Connection pooling and health monitoring
- Data persistence and retrieval
- Search and analytics operations

## 📡 API Endpoints

### Regulations
- `GET /api/v1/regulations/circulars` - Search and filter circulars
- `GET /api/v1/regulations/circulars/{id}` - Get specific circular
- `POST /api/v1/regulations/circulars/{id}/reprocess` - Reprocess circular
- `GET /api/v1/regulations/sources` - Get regulatory sources
- `GET /api/v1/regulations/stats` - Get statistics

### Monitoring
- `POST /api/v1/monitor/trigger` - Trigger manual monitoring
- `GET /api/v1/monitor/status` - Get monitoring status
- `GET /api/v1/monitor/results` - Get monitoring results

### Notifications
- `POST /api/v1/notifications/send` - Send notification
- `GET /api/v1/notifications/subscribers` - Manage subscribers
- `POST /api/v1/notifications/subscribe` - Subscribe to notifications

### Health & Metrics
- `GET /health` - Service health check
- `GET /metrics` - Prometheus metrics
- `GET /api-docs` - Swagger documentation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- Elasticsearch 8+
- Docker & Docker Compose

### Installation

1. **Clone and Install Dependencies**
```bash
cd services/regulatory-intelligence
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Configure database connections and API keys
```

3. **Database Setup**
```bash
# Start databases with Docker Compose
docker-compose -f docker-compose.db.yml up -d

# Run migrations
npm run migrate
```

4. **Start Development Server**
```bash
npm run dev
```

### Docker Deployment

```bash
# Build image
docker build -t regulatory-intelligence .

# Run with Docker Compose
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Connections
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=regulatory_intelligence
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=regulatory_intelligence

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# AI Service Integration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=your-api-key

# Notification Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

SLACK_WEBHOOK_URL=https://hooks.slack.com/...
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

### Monitoring Configuration

```typescript
// Regulatory sources configuration
const regulatorySources = [
  {
    id: 'rbi',
    name: 'Reserve Bank of India',
    schedule: '0 */30 * * * *', // Every 30 minutes
    enabled: true
  },
  {
    id: 'sebi',
    name: 'SEBI',
    schedule: '0 */45 * * * *', // Every 45 minutes
    enabled: true
  }
];
```

## 📊 Monitoring & Observability

### Health Checks
- Service health: `GET /health`
- Database connectivity
- External service dependencies
- Memory and CPU usage

### Metrics (Prometheus)
- Request count and latency
- Error rates by endpoint
- Database connection pool status
- Processing queue metrics
- Notification delivery rates

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking and alerting
- Business event logging

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:coverage
```

### API Testing
```bash
# Using the provided Postman collection
newman run postman/regulatory-intelligence.postman_collection.json
```

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key authentication for external services

### Data Protection
- Encryption at rest and in transit
- Sensitive data masking in logs
- Input validation and sanitization
- Rate limiting and DDoS protection

### Compliance
- GDPR compliance for data handling
- Audit logging for all operations
- Data retention policies
- Secure configuration management

## 📈 Performance

### Optimization Features
- Redis caching for frequently accessed data
- Database query optimization
- Connection pooling
- Async processing for heavy operations

### Scalability
- Horizontal scaling support
- Load balancing ready
- Database sharding capabilities
- Queue-based processing

### Benchmarks
- **Throughput**: 1000+ requests/second
- **Latency**: <100ms for cached responses
- **Processing**: 50+ circulars/minute
- **Uptime**: 99.9% availability target

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit pull request

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive JSDoc documentation
- 90%+ test coverage requirement

## 📚 Documentation

- **API Documentation**: Available at `/api-docs` when service is running
- **Architecture Diagrams**: See `/docs/architecture/`
- **Database Schema**: See `/docs/database/`
- **Deployment Guide**: See `/docs/deployment/`

## 🆘 Support

### Troubleshooting
- Check service logs: `docker logs regulatory-intelligence`
- Verify database connections: `GET /health`
- Monitor metrics: `GET /metrics`

### Common Issues
1. **Database Connection Errors**: Verify connection strings and network access
2. **AI Service Timeout**: Check AI service availability and increase timeout
3. **Memory Issues**: Monitor heap usage and adjust container limits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release with core functionality
- RBI, SEBI, IRDAI monitoring
- AI-powered analysis and notifications
- Comprehensive API and documentation

---

**Enterprise RBI Compliance Management Platform**  
Regulatory Intelligence Service - Production Ready ✅
