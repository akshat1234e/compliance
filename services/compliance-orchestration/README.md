# Compliance Orchestration Service

Central workflow engine for compliance processes and task orchestration in the Enterprise RBI Compliance Management Platform.

## 🎯 Overview

The Compliance Orchestration Service is the central nervous system of the compliance platform, responsible for:

- **Workflow Management**: Creating, executing, and monitoring complex compliance workflows
- **Task Scheduling**: Managing scheduled tasks and recurring jobs
- **Process Automation**: Automating compliance processes and business rules
- **Notification Orchestration**: Coordinating multi-channel notifications
- **Approval Workflows**: Managing approval processes and escalations
- **Integration Coordination**: Orchestrating interactions between microservices

## 🏗️ Architecture

### Core Components

1. **Workflow Engine**: Executes and manages workflow instances
2. **Task Scheduler**: Handles scheduled and recurring tasks
3. **Notification Service**: Manages multi-channel notifications
4. **Process Manager**: Coordinates business processes
5. **Approval Engine**: Handles approval workflows

### Key Features

- ✅ **Advanced Workflow Engine** with step-by-step execution
- ✅ **Task Scheduling** with cron-based recurring jobs
- ✅ **Multi-Channel Notifications** (Email, Slack, Teams, In-App)
- ✅ **Approval Workflows** with escalation support
- ✅ **Process Templates** for reusable workflows
- ✅ **Real-time Monitoring** and metrics
- ✅ **Error Handling** with retry mechanisms
- ✅ **Audit Logging** for compliance tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- MongoDB 5+
- Redis 6+
- Bull Queue for job processing

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd services/compliance-orchestration

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your environment variables
nano .env

# Build the application
npm run build

# Start the service
npm start
```

### Development

```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## 📡 API Endpoints

### Workflows

- `POST /api/v1/workflows` - Create a new workflow
- `GET /api/v1/workflows` - List workflows with filtering
- `GET /api/v1/workflows/:id` - Get workflow details
- `PUT /api/v1/workflows/:id` - Update workflow
- `POST /api/v1/workflows/:id/pause` - Pause workflow
- `POST /api/v1/workflows/:id/resume` - Resume workflow
- `POST /api/v1/workflows/:id/cancel` - Cancel workflow

### Tasks

- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks` - List tasks
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Cancel task

### Notifications

- `POST /api/v1/notifications` - Send notification
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/:id` - Get notification details
- `POST /api/v1/notifications/:id/retry` - Retry failed notification

### Health & Monitoring

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe
- `GET /health/metrics` - Prometheus metrics

## 🔧 Configuration

### Environment Variables

Key configuration options:

```bash
# Application
NODE_ENV=development
PORT=3002

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=compliance_orchestration
MONGODB_URI=mongodb://localhost:27017
REDIS_HOST=localhost
REDIS_PORT=6379

# Workflow Engine
MAX_CONCURRENT_WORKFLOWS=100
WORKFLOW_DEFAULT_TIMEOUT=3600000
WORKFLOW_RETRY_ATTEMPTS=3

# Task Scheduler
SCHEDULER_CONCURRENCY=10
SCHEDULER_MAX_RETRIES=3
SCHEDULER_BACKOFF_STRATEGY=exponential

# Notifications
EMAIL_NOTIFICATIONS_ENABLED=true
SLACK_NOTIFICATIONS_ENABLED=false
TEAMS_NOTIFICATIONS_ENABLED=false
```

### Workflow Definitions

Example workflow definition:

```json
{
  "id": "compliance-review-workflow",
  "name": "Compliance Review Process",
  "version": "1.0.0",
  "category": "compliance",
  "steps": [
    {
      "id": "initial-review",
      "name": "Initial Review",
      "type": "task",
      "config": {
        "assignees": ["compliance-team"],
        "dueDate": "7d"
      }
    },
    {
      "id": "approval",
      "name": "Manager Approval",
      "type": "approval",
      "config": {
        "approvers": ["manager"],
        "approvalType": "any"
      }
    },
    {
      "id": "notification",
      "name": "Completion Notification",
      "type": "notification",
      "config": {
        "template": "workflow_completed",
        "channels": ["email", "in_app"]
      }
    }
  ]
}
```

## 🔄 Workflow Types

### Supported Step Types

1. **Task**: Manual or automated tasks
2. **Approval**: Approval processes with multiple approvers
3. **Notification**: Multi-channel notifications
4. **Condition**: Conditional branching logic
5. **Parallel**: Parallel execution of multiple steps
6. **Delay**: Time-based delays
7. **Webhook**: External service calls
8. **Script**: Custom script execution

### Workflow States

- `pending`: Workflow created but not started
- `running`: Workflow is executing
- `paused`: Workflow execution paused
- `completed`: Workflow completed successfully
- `failed`: Workflow failed with errors
- `cancelled`: Workflow cancelled by user

## 📊 Monitoring & Metrics

### Health Checks

The service provides comprehensive health checks:

- **Basic Health**: Service status and uptime
- **Detailed Health**: Dependencies and system metrics
- **Readiness**: Service ready to accept requests
- **Liveness**: Service is alive and responsive

### Metrics

Key metrics tracked:

- Workflow execution counts and success rates
- Task completion times and failure rates
- Notification delivery statistics
- System resource usage
- Queue depths and processing times

### Logging

Structured logging with:

- Request/response logging
- Workflow execution logs
- Error tracking and stack traces
- Performance monitoring
- Security event logging

## 🧪 Testing

### Test Structure

```bash
src/__tests__/
├── setup.ts                 # Test configuration
├── workflow-engine.test.ts  # Workflow engine tests
├── task-scheduler.test.ts   # Task scheduler tests
├── notification.test.ts     # Notification tests
└── integration/             # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test workflow-engine.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker Deployment

### Build Image

```bash
# Build Docker image
docker build -t compliance-orchestration:latest .

# Run container
docker run -p 3002:3002 \
  -e NODE_ENV=production \
  -e POSTGRES_HOST=postgres \
  -e MONGODB_URI=mongodb://mongodb:27017 \
  -e REDIS_HOST=redis \
  compliance-orchestration:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  compliance-orchestration:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - POSTGRES_HOST=postgres
      - MONGODB_URI=mongodb://mongodb:27017
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - mongodb
      - redis
```

## 🔐 Security

### Authentication

- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization
- API key authentication for service-to-service

### Security Features

- Request rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Security headers (Helmet.js)

## 📈 Performance

### Optimization Features

- Connection pooling for databases
- Redis caching for frequently accessed data
- Bulk operations for high-throughput scenarios
- Async processing with Bull queues
- Memory usage monitoring
- Performance metrics tracking

### Scalability

- Horizontal scaling support
- Load balancing ready
- Stateless design
- Database connection pooling
- Queue-based task processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Use structured logging
- Follow the existing code style
- Update documentation for new features

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation wiki
- Review the API documentation

---

**Compliance Orchestration Service** - Central workflow engine for enterprise compliance management.
