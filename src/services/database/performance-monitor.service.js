// Database Performance Monitoring Service
// Real-time monitoring and alerting for database performance

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const { Logger } = require('../logging/logger.service');
const { MetricsService } = require('../monitoring/metrics.service');
const { AlertService } = require('../monitoring/alert.service');

class PerformanceMonitorService extends EventEmitter {
  constructor(databaseConnection, options = {}) {
    super();
    this.db = databaseConnection;
    this.logger = new Logger('PerformanceMonitor');
    this.metrics = new MetricsService();
    this.alerts = new AlertService();
    
    this.config = {
      // Performance thresholds
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      verySlowQueryThreshold: options.verySlowQueryThreshold || 5000, // 5 seconds
      highConnectionThreshold: options.highConnectionThreshold || 80, // 80% of max
      highCpuThreshold: options.highCpuThreshold || 80, // 80%
      highMemoryThreshold: options.highMemoryThreshold || 85, // 85%
      
      // Monitoring intervals
      performanceCheckInterval: options.performanceCheckInterval || 30000, // 30 seconds
      detailedAnalysisInterval: options.detailedAnalysisInterval || 300000, // 5 minutes
      alertCooldownPeriod: options.alertCooldownPeriod || 600000, // 10 minutes
      
      // Features
      enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
      enableQueryProfiling: options.enableQueryProfiling !== false,
      enableResourceMonitoring: options.enableResourceMonitoring !== false,
      enableAutomaticOptimization: options.enableAutomaticOptimization || false,
      
      ...options
    };
    
    this.performanceData = {
      queries: new Map(),
      connections: new Map(),
      resources: new Map(),
      alerts: new Map()
    };
    
    this.queryProfiler = new QueryProfiler(this.db, this.config);
    this.resourceMonitor = new ResourceMonitor(this.db, this.config);
    this.alertManager = new AlertManager(this.alerts, this.config);
    
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  async initializeMonitoring() {
    try {
      if (this.config.enableQueryProfiling) {
        await this.setupQueryProfiling();
      }
      
      if (this.config.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }
      
      if (this.config.enableResourceMonitoring) {
        this.startResourceMonitoring();
      }
      
      this.setupEventHandlers();
      
      this.logger.info('Performance monitoring initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize performance monitoring:', error);
      throw error;
    }
  }

  /**
   * Setup query profiling
   */
  async setupQueryProfiling() {
    try {
      // Enable MongoDB profiler for slow operations
      await this.db.admin().command({
        profile: 2, // Profile all operations
        slowms: this.config.slowQueryThreshold,
        sampleRate: 1.0
      });
      
      this.logger.info('Query profiling enabled');
    } catch (error) {
      this.logger.warn('Failed to enable query profiling:', error);
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring() {
    // Monitor query performance
    setInterval(async () => {
      await this.monitorQueryPerformance();
    }, this.config.performanceCheckInterval);
    
    // Detailed performance analysis
    setInterval(async () => {
      await this.performDetailedAnalysis();
    }, this.config.detailedAnalysisInterval);
    
    this.logger.info('Real-time monitoring started');
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    setInterval(async () => {
      await this.monitorDatabaseResources();
    }, this.config.performanceCheckInterval);
    
    this.logger.info('Resource monitoring started');
  }

  /**
   * Monitor query performance
   */
  async monitorQueryPerformance() {
    try {
      const profileData = await this.getProfilerData();
      
      for (const operation of profileData) {
        await this.analyzeQueryOperation(operation);
      }
      
      // Check for performance degradation
      await this.checkPerformanceDegradation();
      
    } catch (error) {
      this.logger.error('Failed to monitor query performance:', error);
    }
  }

  /**
   * Get profiler data
   */
  async getProfilerData() {
    try {
      const profileCollection = this.db.db('admin').collection('system.profile');
      
      // Get recent operations
      const recentOperations = await profileCollection
        .find({
          ts: { $gte: new Date(Date.now() - this.config.performanceCheckInterval) }
        })
        .sort({ ts: -1 })
        .limit(1000)
        .toArray();
      
      return recentOperations;
    } catch (error) {
      this.logger.warn('Failed to get profiler data:', error);
      return [];
    }
  }

  /**
   * Analyze individual query operation
   */
  async analyzeQueryOperation(operation) {
    const {
      ns: namespace,
      op: operationType,
      command,
      ts: timestamp,
      millis: duration,
      docsExamined,
      docsReturned,
      keysExamined,
      planSummary
    } = operation;
    
    // Record metrics
    this.recordQueryMetrics(operation);
    
    // Check for slow queries
    if (duration >= this.config.slowQueryThreshold) {
      await this.handleSlowQuery(operation);
    }
    
    // Check for inefficient queries
    if (this.isInefficient(operation)) {
      await this.handleInefficientQuery(operation);
    }
    
    // Update performance data
    this.updateQueryPerformanceData(operation);
  }

  /**
   * Record query metrics
   */
  recordQueryMetrics(operation) {
    const labels = {
      namespace: operation.ns,
      operation: operation.op,
      command: operation.command ? Object.keys(operation.command)[0] : 'unknown'
    };
    
    this.metrics.histogram('database.query_duration', operation.millis || 0, labels);
    this.metrics.histogram('database.docs_examined', operation.docsExamined || 0, labels);
    this.metrics.histogram('database.docs_returned', operation.docsReturned || 0, labels);
    this.metrics.histogram('database.keys_examined', operation.keysExamined || 0, labels);
    
    this.metrics.increment('database.operations_total', labels);
    
    if (operation.millis >= this.config.slowQueryThreshold) {
      this.metrics.increment('database.slow_queries_total', labels);
    }
  }

  /**
   * Handle slow query detection
   */
  async handleSlowQuery(operation) {
    const severity = operation.millis >= this.config.verySlowQueryThreshold ? 'critical' : 'warning';
    
    this.logger.warn('Slow query detected:', {
      namespace: operation.ns,
      operation: operation.op,
      duration: operation.millis,
      command: operation.command,
      planSummary: operation.planSummary
    });
    
    // Emit slow query event
    this.emit('slowQuery', {
      operation,
      severity,
      timestamp: new Date()
    });
    
    // Send alert if threshold exceeded
    if (operation.millis >= this.config.verySlowQueryThreshold) {
      await this.alertManager.sendAlert({
        type: 'VERY_SLOW_QUERY',
        severity: 'critical',
        message: `Very slow query detected: ${operation.millis}ms`,
        details: operation
      });
    }
  }

  /**
   * Check if query is inefficient
   */
  isInefficient(operation) {
    const { docsExamined = 0, docsReturned = 0, keysExamined = 0 } = operation;
    
    // High examination ratio
    if (docsReturned > 0 && docsExamined / docsReturned > 100) {
      return true;
    }
    
    // High key examination without results
    if (keysExamined > 1000 && docsReturned === 0) {
      return true;
    }
    
    // Collection scan on large collections
    if (operation.planSummary === 'COLLSCAN' && docsExamined > 10000) {
      return true;
    }
    
    return false;
  }

  /**
   * Handle inefficient query
   */
  async handleInefficientQuery(operation) {
    this.logger.warn('Inefficient query detected:', {
      namespace: operation.ns,
      operation: operation.op,
      docsExamined: operation.docsExamined,
      docsReturned: operation.docsReturned,
      keysExamined: operation.keysExamined,
      planSummary: operation.planSummary
    });
    
    this.emit('inefficientQuery', {
      operation,
      timestamp: new Date()
    });
    
    // Suggest optimization
    const suggestion = this.generateOptimizationSuggestion(operation);
    if (suggestion) {
      this.emit('optimizationSuggestion', suggestion);
    }
  }

  /**
   * Generate optimization suggestion
   */
  generateOptimizationSuggestion(operation) {
    const suggestions = [];
    
    if (operation.planSummary === 'COLLSCAN') {
      suggestions.push({
        type: 'INDEX_NEEDED',
        message: 'Query is performing a collection scan. Consider adding an appropriate index.',
        collection: operation.ns.split('.')[1],
        command: operation.command
      });
    }
    
    if (operation.docsExamined > operation.docsReturned * 10) {
      suggestions.push({
        type: 'INEFFICIENT_INDEX',
        message: 'Query is examining too many documents. Review index selectivity.',
        collection: operation.ns.split('.')[1],
        examinationRatio: operation.docsExamined / operation.docsReturned
      });
    }
    
    return suggestions.length > 0 ? suggestions : null;
  }

  /**
   * Monitor database resources
   */
  async monitorDatabaseResources() {
    try {
      const serverStatus = await this.db.admin().command({ serverStatus: 1 });
      const dbStats = await this.db.stats();
      
      // Analyze resource usage
      await this.analyzeResourceUsage(serverStatus, dbStats);
      
      // Check for resource alerts
      await this.checkResourceAlerts(serverStatus, dbStats);
      
    } catch (error) {
      this.logger.error('Failed to monitor database resources:', error);
    }
  }

  /**
   * Analyze resource usage
   */
  async analyzeResourceUsage(serverStatus, dbStats) {
    const {
      connections,
      mem,
      opcounters,
      wiredTiger
    } = serverStatus;
    
    // Connection metrics
    const connectionUsage = (connections.current / connections.available) * 100;
    this.metrics.gauge('database.connection_usage_percent', connectionUsage);
    this.metrics.gauge('database.connections_current', connections.current);
    this.metrics.gauge('database.connections_available', connections.available);
    
    // Memory metrics
    this.metrics.gauge('database.memory_resident_mb', mem.resident);
    this.metrics.gauge('database.memory_virtual_mb', mem.virtual);
    this.metrics.gauge('database.memory_mapped_mb', mem.mapped || 0);
    
    // Operation counters
    this.metrics.gauge('database.operations_insert', opcounters.insert);
    this.metrics.gauge('database.operations_query', opcounters.query);
    this.metrics.gauge('database.operations_update', opcounters.update);
    this.metrics.gauge('database.operations_delete', opcounters.delete);
    
    // Storage metrics
    this.metrics.gauge('database.storage_size_mb', dbStats.storageSize / 1024 / 1024);
    this.metrics.gauge('database.data_size_mb', dbStats.dataSize / 1024 / 1024);
    this.metrics.gauge('database.index_size_mb', dbStats.indexSize / 1024 / 1024);
    
    // WiredTiger cache metrics (if available)
    if (wiredTiger && wiredTiger.cache) {
      const cacheUsage = (wiredTiger.cache['bytes currently in the cache'] / 
                         wiredTiger.cache['maximum bytes configured']) * 100;
      this.metrics.gauge('database.cache_usage_percent', cacheUsage);
    }
  }

  /**
   * Check for resource alerts
   */
  async checkResourceAlerts(serverStatus, dbStats) {
    const { connections, mem } = serverStatus;
    
    // High connection usage
    const connectionUsage = (connections.current / connections.available) * 100;
    if (connectionUsage > this.config.highConnectionThreshold) {
      await this.alertManager.sendAlert({
        type: 'HIGH_CONNECTION_USAGE',
        severity: 'warning',
        message: `High connection usage: ${connectionUsage.toFixed(1)}%`,
        details: { current: connections.current, available: connections.available }
      });
    }
    
    // High memory usage
    const memoryUsage = (mem.resident / mem.virtual) * 100;
    if (memoryUsage > this.config.highMemoryThreshold) {
      await this.alertManager.sendAlert({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'warning',
        message: `High memory usage: ${memoryUsage.toFixed(1)}%`,
        details: { resident: mem.resident, virtual: mem.virtual }
      });
    }
  }

  /**
   * Perform detailed performance analysis
   */
  async performDetailedAnalysis() {
    try {
      // Analyze query patterns
      const queryAnalysis = await this.analyzeQueryPatterns();
      
      // Analyze index effectiveness
      const indexAnalysis = await this.analyzeIndexEffectiveness();
      
      // Generate performance report
      const report = this.generatePerformanceReport(queryAnalysis, indexAnalysis);
      
      this.emit('performanceReport', report);
      
      this.logger.info('Detailed performance analysis completed');
      
    } catch (error) {
      this.logger.error('Failed to perform detailed analysis:', error);
    }
  }

  /**
   * Analyze query patterns
   */
  async analyzeQueryPatterns() {
    const patterns = new Map();
    
    for (const [querySignature, data] of this.performanceData.queries.entries()) {
      const pattern = {
        signature: querySignature,
        frequency: data.count,
        avgDuration: data.totalDuration / data.count,
        maxDuration: data.maxDuration,
        lastSeen: data.lastSeen
      };
      
      patterns.set(querySignature, pattern);
    }
    
    return Array.from(patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50); // Top 50 patterns
  }

  /**
   * Analyze index effectiveness
   */
  async analyzeIndexEffectiveness() {
    // This would analyze index usage statistics
    // Implementation depends on MongoDB version and available metrics
    return {
      totalIndexes: 0,
      unusedIndexes: 0,
      inefficientIndexes: 0,
      recommendations: []
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(queryAnalysis, indexAnalysis) {
    const now = new Date();
    
    return {
      timestamp: now,
      summary: {
        totalQueries: Array.from(this.performanceData.queries.values())
          .reduce((sum, data) => sum + data.count, 0),
        slowQueries: Array.from(this.performanceData.queries.values())
          .filter(data => data.avgDuration > this.config.slowQueryThreshold).length,
        avgQueryDuration: this.calculateAverageQueryDuration(),
        topSlowQueries: queryAnalysis
          .sort((a, b) => b.avgDuration - a.avgDuration)
          .slice(0, 10)
      },
      queryPatterns: queryAnalysis,
      indexAnalysis,
      recommendations: this.generateRecommendations(queryAnalysis, indexAnalysis)
    };
  }

  /**
   * Calculate average query duration
   */
  calculateAverageQueryDuration() {
    const queries = Array.from(this.performanceData.queries.values());
    if (queries.length === 0) return 0;
    
    const totalDuration = queries.reduce((sum, data) => sum + data.totalDuration, 0);
    const totalCount = queries.reduce((sum, data) => sum + data.count, 0);
    
    return totalCount > 0 ? totalDuration / totalCount : 0;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(queryAnalysis, indexAnalysis) {
    const recommendations = [];
    
    // Slow query recommendations
    const slowQueries = queryAnalysis.filter(q => q.avgDuration > this.config.slowQueryThreshold);
    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'OPTIMIZE_SLOW_QUERIES',
        priority: 'high',
        message: `${slowQueries.length} query patterns are consistently slow`,
        details: slowQueries.slice(0, 5)
      });
    }
    
    // Frequent query recommendations
    const frequentQueries = queryAnalysis.slice(0, 10);
    recommendations.push({
      type: 'OPTIMIZE_FREQUENT_QUERIES',
      priority: 'medium',
      message: 'Focus optimization efforts on most frequent queries',
      details: frequentQueries
    });
    
    return recommendations;
  }

  /**
   * Update query performance data
   */
  updateQueryPerformanceData(operation) {
    const signature = this.getQuerySignature(operation);
    
    if (!this.performanceData.queries.has(signature)) {
      this.performanceData.queries.set(signature, {
        count: 0,
        totalDuration: 0,
        maxDuration: 0,
        lastSeen: null
      });
    }
    
    const data = this.performanceData.queries.get(signature);
    data.count++;
    data.totalDuration += operation.millis || 0;
    data.maxDuration = Math.max(data.maxDuration, operation.millis || 0);
    data.lastSeen = operation.ts;
  }

  /**
   * Get query signature for grouping
   */
  getQuerySignature(operation) {
    const { ns, op, command } = operation;
    const commandType = command ? Object.keys(command)[0] : 'unknown';
    return `${ns}.${op}.${commandType}`;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.on('slowQuery', (event) => {
      this.metrics.increment('database.slow_query_events', {
        severity: event.severity
      });
    });
    
    this.on('inefficientQuery', (event) => {
      this.metrics.increment('database.inefficient_query_events');
    });
    
    this.on('optimizationSuggestion', (suggestion) => {
      this.logger.info('Optimization suggestion generated:', suggestion);
    });
  }

  /**
   * Check for performance degradation
   */
  async checkPerformanceDegradation() {
    // Compare current performance with historical baselines
    // This would implement trend analysis and alerting
    
    const currentAvgDuration = this.calculateAverageQueryDuration();
    
    // Simple threshold-based check
    if (currentAvgDuration > this.config.slowQueryThreshold * 0.5) {
      this.emit('performanceDegradation', {
        currentAvgDuration,
        threshold: this.config.slowQueryThreshold * 0.5,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics() {
    return {
      queries: {
        total: Array.from(this.performanceData.queries.values())
          .reduce((sum, data) => sum + data.count, 0),
        unique: this.performanceData.queries.size,
        slow: Array.from(this.performanceData.queries.values())
          .filter(data => (data.totalDuration / data.count) > this.config.slowQueryThreshold).length
      },
      averageDuration: this.calculateAverageQueryDuration(),
      topQueries: Array.from(this.performanceData.queries.entries())
        .map(([signature, data]) => ({
          signature,
          count: data.count,
          avgDuration: data.totalDuration / data.count,
          maxDuration: data.maxDuration
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
}

/**
 * Query Profiler helper class
 */
class QueryProfiler {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }
}

/**
 * Resource Monitor helper class
 */
class ResourceMonitor {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }
}

/**
 * Alert Manager helper class
 */
class AlertManager {
  constructor(alertService, config) {
    this.alerts = alertService;
    this.config = config;
    this.lastAlerts = new Map();
  }
  
  async sendAlert(alert) {
    const alertKey = `${alert.type}_${alert.severity}`;
    const lastAlert = this.lastAlerts.get(alertKey);
    
    // Implement cooldown period
    if (lastAlert && Date.now() - lastAlert < this.config.alertCooldownPeriod) {
      return;
    }
    
    await this.alerts.send(alert);
    this.lastAlerts.set(alertKey, Date.now());
  }
}

module.exports = { PerformanceMonitorService };
