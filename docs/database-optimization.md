# Database Query Optimization Guide

This document provides comprehensive guidance on database query optimization for the RBI Compliance Platform, including implementation details, best practices, and performance monitoring.

## 📊 Overview

The database optimization system provides:

- **Intelligent Query Optimization**: Automatic query structure optimization
- **Advanced Indexing**: Smart index management and suggestions
- **Connection Pooling**: Efficient connection management with load balancing
- **Performance Monitoring**: Real-time performance tracking and alerting
- **Caching Layer**: Multi-level caching for improved response times

## 🏗️ Architecture Components

### 1. Query Optimizer Service

**Location**: `src/services/database/query-optimizer.service.js`

**Features**:
- Automatic query structure optimization
- Query execution plan analysis
- Index usage monitoring
- Slow query detection and alerting
- Query result caching

**Usage**:
```javascript
const { QueryOptimizerService } = require('./services/database/query-optimizer.service');

const optimizer = new QueryOptimizerService(databaseConnection, {
  slowQueryThreshold: 1000,
  enableQueryCache: true,
  cacheTimeout: 300
});

// Execute optimized query
const result = await optimizer.executeOptimizedQuery(
  'compliance_tasks',
  'find',
  { assignedTo: userId, status: 'PENDING' },
  { sort: { dueDate: 1 }, limit: 50 }
);
```

### 2. Connection Pool Service

**Location**: `src/services/database/connection-pool.service.js`

**Features**:
- Primary/replica connection management
- Load balancing strategies (round-robin, least connections, weighted)
- Health monitoring and automatic failover
- Connection metrics and alerting

**Configuration**:
```javascript
const poolService = new ConnectionPoolService({
  primaryUri: 'mongodb://primary:27017/rbi_compliance',
  readReplicas: [
    'mongodb://replica1:27017/rbi_compliance',
    'mongodb://replica2:27017/rbi_compliance'
  ],
  minPoolSize: 5,
  maxPoolSize: 50,
  loadBalancingStrategy: 'least_connections'
});
```

### 3. Indexing Service

**Location**: `src/services/database/indexing.service.js`

**Features**:
- Automatic index creation for optimal performance
- Index usage analysis and optimization suggestions
- Unused index detection and cleanup
- Compound index recommendations

**Index Definitions**:
```javascript
// Compliance tasks indexes
{
  name: 'assignee_status_compound',
  key: { assignedTo: 1, status: 1 },
  options: { background: true }
},
{
  name: 'due_date_priority_compound',
  key: { dueDate: 1, priority: 1 },
  options: { background: true }
}
```

### 4. Performance Monitor Service

**Location**: `src/services/database/performance-monitor.service.js`

**Features**:
- Real-time query performance monitoring
- Resource usage tracking (CPU, memory, connections)
- Automated alerting for performance issues
- Performance trend analysis and reporting

### 5. Optimized Base Repository

**Location**: `src/repositories/optimized-base.repository.js`

**Features**:
- Built-in query optimization
- Automatic caching layer
- Performance metrics collection
- Standardized CRUD operations with optimization

## 🚀 Performance Optimizations

### Query Optimization Techniques

#### 1. Index-Aware Query Planning
```javascript
// Automatic index selection for optimal performance
const optimizedQuery = {
  assignedTo: userId,        // Uses assignee_status_compound index
  status: 'PENDING',         // Combined with assignedTo for compound index
  dueDate: { $lte: tomorrow } // Uses due_date_priority_compound index
};
```

#### 2. Aggregation Pipeline Optimization
```javascript
// Optimized pipeline with $match stages moved to beginning
const optimizedPipeline = [
  { $match: { status: 'ACTIVE' } },      // Filter early
  { $match: { category: 'REGULATORY' } }, // Additional filtering
  { $lookup: { /* join operation */ } },   // Expensive operations after filtering
  { $group: { /* grouping */ } }
];
```

#### 3. Projection Optimization
```javascript
// Automatic projection to exclude large fields
const defaultProjection = {
  __v: 0,                    // Exclude version field
  'metadata.raw': 0,         // Exclude large binary data
  'content.binary': 0        // Exclude file content
};
```

### Indexing Strategy

#### 1. Compound Indexes for Common Query Patterns
```javascript
// User queries: role + status
{ role: 1, isActive: 1 }

// Task queries: assignee + due date
{ assignedTo: 1, dueDate: 1 }

// Transaction queries: customer + date
{ customerId: 1, transactionDate: -1 }
```

#### 2. Text Search Indexes
```javascript
// Document search with weighted fields
{
  fileName: 'text',
  title: 'text',
  description: 'text'
},
{
  weights: { title: 10, fileName: 5, description: 1 }
}
```

#### 3. Sparse Indexes for Optional Fields
```javascript
// Employee ID (not all users have this)
{ 'profile.employeeId': 1 }, { sparse: true }

// PAN number (not all customers have this)
{ 'personalInfo.panNumber': 1 }, { sparse: true }
```

### Connection Pool Optimization

#### 1. Load Balancing Strategies

**Round Robin**:
```javascript
// Distributes connections evenly across replicas
loadBalancingStrategy: 'round_robin'
```

**Least Connections**:
```javascript
// Routes to replica with fewest active connections
loadBalancingStrategy: 'least_connections'
```

**Weighted**:
```javascript
// Routes based on replica weights/capacity
loadBalancingStrategy: 'weighted'
```

#### 2. Connection Pool Sizing
```javascript
// Optimal pool configuration
{
  minPoolSize: 5,           // Minimum connections maintained
  maxPoolSize: 50,          // Maximum connections allowed
  maxIdleTimeMS: 30000,     // Close idle connections after 30s
  waitQueueTimeoutMS: 5000  // Max wait time for connection
}
```

## 📈 Performance Monitoring

### Key Metrics

#### 1. Query Performance Metrics
- **Average Query Duration**: Target < 100ms for simple queries
- **Slow Query Count**: Target < 1% of total queries
- **Cache Hit Rate**: Target > 80%
- **Index Usage**: Monitor unused indexes

#### 2. Connection Pool Metrics
- **Connection Utilization**: Target < 80% of max pool size
- **Connection Wait Time**: Target < 100ms
- **Failed Connections**: Target < 0.1%

#### 3. Resource Metrics
- **CPU Usage**: Target < 70%
- **Memory Usage**: Target < 80%
- **Disk I/O**: Monitor for bottlenecks

### Performance Thresholds

```javascript
const performanceThresholds = {
  slowQueryThreshold: 1000,        // 1 second
  verySlowQueryThreshold: 5000,    // 5 seconds
  highConnectionThreshold: 80,     // 80% of max connections
  highCpuThreshold: 80,           // 80% CPU usage
  highMemoryThreshold: 85         // 85% memory usage
};
```

### Alerting Configuration

```javascript
// Automatic alerts for performance issues
const alerts = [
  {
    type: 'SLOW_QUERY',
    threshold: 5000,
    severity: 'critical',
    action: 'immediate_notification'
  },
  {
    type: 'HIGH_CONNECTION_USAGE',
    threshold: 80,
    severity: 'warning',
    action: 'scale_connections'
  },
  {
    type: 'CACHE_MISS_RATE',
    threshold: 50,
    severity: 'warning',
    action: 'review_caching_strategy'
  }
];
```

## 🛠️ Implementation Guide

### 1. Setting Up Query Optimization

```javascript
// Initialize query optimizer
const { QueryOptimizerService } = require('./services/database/query-optimizer.service');

const queryOptimizer = new QueryOptimizerService(db, {
  slowQueryThreshold: 1000,
  enableQueryCache: true,
  enableExplainAnalyze: true,
  cacheTimeout: 300
});

// Use in repository
class ComplianceTaskRepository extends OptimizedBaseRepository {
  constructor(db) {
    super(db.collection('compliance_tasks'), {
      enableQueryOptimization: true,
      enableCaching: true,
      cacheTimeout: 300
    });
  }
  
  async findTasksByAssignee(userId, options = {}) {
    return this.find(
      { assignedTo: userId },
      { sort: { dueDate: 1 }, ...options }
    );
  }
}
```

### 2. Implementing Connection Pooling

```javascript
// Setup connection pool
const { ConnectionPoolService } = require('./services/database/connection-pool.service');

const connectionPool = new ConnectionPoolService({
  primaryUri: process.env.MONGODB_PRIMARY_URI,
  readReplicas: process.env.MONGODB_READ_REPLICAS?.split(',') || [],
  minPoolSize: 5,
  maxPoolSize: 50,
  loadBalancingStrategy: 'least_connections'
});

// Use in application
app.use((req, res, next) => {
  req.db = connectionPool.getConnection(req.method === 'GET' ? 'read' : 'write');
  next();
});
```

### 3. Setting Up Performance Monitoring

```javascript
// Initialize performance monitor
const { PerformanceMonitorService } = require('./services/database/performance-monitor.service');

const performanceMonitor = new PerformanceMonitorService(db, {
  enableRealTimeMonitoring: true,
  enableQueryProfiling: true,
  slowQueryThreshold: 1000,
  performanceCheckInterval: 30000
});

// Handle performance events
performanceMonitor.on('slowQuery', (event) => {
  logger.warn('Slow query detected:', event);
  // Send alert to monitoring system
});

performanceMonitor.on('performanceReport', (report) => {
  logger.info('Performance report generated:', report);
  // Store report for analysis
});
```

## 📊 Performance Benchmarks

### Target Performance Metrics

| Operation Type | Target Response Time | Acceptable Limit |
|---------------|---------------------|------------------|
| Simple Find | < 50ms | < 200ms |
| Complex Aggregation | < 500ms | < 2000ms |
| Count Operations | < 100ms | < 500ms |
| Insert Operations | < 100ms | < 300ms |
| Update Operations | < 150ms | < 500ms |
| Delete Operations | < 100ms | < 300ms |

### Throughput Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| Queries per Second | > 1000 | Real-time |
| Concurrent Connections | < 80% of max | Continuous |
| Cache Hit Rate | > 80% | Hourly |
| Index Usage | > 95% | Daily |

## 🔧 Troubleshooting

### Common Performance Issues

#### 1. Slow Queries
**Symptoms**: High response times, timeout errors
**Solutions**:
- Add appropriate indexes
- Optimize query structure
- Use aggregation pipeline optimization
- Implement query result caching

#### 2. High Connection Usage
**Symptoms**: Connection timeouts, pool exhaustion
**Solutions**:
- Increase pool size
- Optimize connection lifecycle
- Implement connection pooling
- Add read replicas

#### 3. Memory Issues
**Symptoms**: High memory usage, OOM errors
**Solutions**:
- Optimize query projections
- Implement result pagination
- Use streaming for large datasets
- Optimize aggregation pipelines

#### 4. Index Issues
**Symptoms**: Collection scans, slow queries
**Solutions**:
- Analyze query patterns
- Create compound indexes
- Remove unused indexes
- Optimize index order

### Debugging Tools

```javascript
// Get query statistics
const stats = queryOptimizer.getQueryStatistics();
console.log('Query performance:', stats);

// Get connection pool status
const poolStats = connectionPool.getStatistics();
console.log('Connection pool:', poolStats);

// Get index analysis
const indexStats = indexingService.getIndexStatistics();
console.log('Index usage:', indexStats);

// Get performance metrics
const perfStats = performanceMonitor.getPerformanceStatistics();
console.log('Performance metrics:', perfStats);
```

## 📚 Best Practices

### 1. Query Design
- Use compound indexes for multi-field queries
- Limit result sets with appropriate filters
- Use projection to exclude unnecessary fields
- Prefer aggregation over multiple queries

### 2. Index Management
- Create indexes for all query patterns
- Monitor index usage regularly
- Remove unused indexes
- Use background index creation

### 3. Connection Management
- Use connection pooling
- Implement proper error handling
- Monitor connection health
- Use read replicas for read operations

### 4. Caching Strategy
- Cache frequently accessed data
- Implement cache invalidation
- Use appropriate cache timeouts
- Monitor cache hit rates

### 5. Monitoring and Alerting
- Set up comprehensive monitoring
- Configure appropriate alerts
- Regular performance reviews
- Proactive optimization

---

This optimization system ensures the RBI Compliance Platform maintains high performance and scalability while handling complex financial data operations efficiently.
