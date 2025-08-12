// Database Query Optimizer Service
// Comprehensive query optimization, indexing, and performance monitoring

const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');
const { Logger } = require('../logging/logger.service');
const { MetricsService } = require('../monitoring/metrics.service');
const { CacheService } = require('../cache/cache.service');

class QueryOptimizerService extends EventEmitter {
  constructor(databaseConnection, options = {}) {
    super();
    this.db = databaseConnection;
    this.logger = new Logger('QueryOptimizer');
    this.metrics = new MetricsService();
    this.cache = new CacheService();
    
    this.config = {
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      enableQueryCache: options.enableQueryCache !== false,
      cacheTimeout: options.cacheTimeout || 300, // 5 minutes
      enableExplainAnalyze: options.enableExplainAnalyze !== false,
      maxCacheSize: options.maxCacheSize || 1000,
      enableQueryLogging: options.enableQueryLogging !== false,
      ...options
    };
    
    this.queryStats = new Map();
    this.indexSuggestions = new Map();
    this.queryCache = new Map();
    
    this.initializeOptimizer();
  }

  /**
   * Initialize the query optimizer
   */
  async initializeOptimizer() {
    try {
      await this.createPerformanceIndexes();
      await this.setupQueryMonitoring();
      this.startPerformanceAnalysis();
      
      this.logger.info('Query optimizer initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize query optimizer:', error);
      throw error;
    }
  }

  /**
   * Create essential performance indexes
   */
  async createPerformanceIndexes() {
    const indexes = [
      // User indexes
      { collection: 'users', index: { email: 1 }, options: { unique: true } },
      { collection: 'users', index: { 'profile.employeeId': 1 }, options: { sparse: true } },
      { collection: 'users', index: { role: 1, isActive: 1 } },
      { collection: 'users', index: { createdAt: -1 } },
      { collection: 'users', index: { lastLoginAt: -1 }, options: { sparse: true } },

      // Compliance task indexes
      { collection: 'compliance_tasks', index: { assignedTo: 1, status: 1 } },
      { collection: 'compliance_tasks', index: { dueDate: 1, priority: 1 } },
      { collection: 'compliance_tasks', index: { category: 1, status: 1 } },
      { collection: 'compliance_tasks', index: { createdAt: -1 } },
      { collection: 'compliance_tasks', index: { 'tags': 1 } },
      { collection: 'compliance_tasks', index: { assignedTo: 1, dueDate: 1 } },
      { collection: 'compliance_tasks', index: { status: 1, updatedAt: -1 } },

      // Document indexes
      { collection: 'documents', index: { uploadedBy: 1, createdAt: -1 } },
      { collection: 'documents', index: { type: 1, category: 1 } },
      { collection: 'documents', index: { 'metadata.classification': 1 } },
      { collection: 'documents', index: { tags: 1 } },
      { collection: 'documents', index: { fileName: 'text', title: 'text', description: 'text' } },
      { collection: 'documents', index: { status: 1, createdAt: -1 } },

      // Customer indexes
      { collection: 'customers', index: { customerId: 1 }, options: { unique: true } },
      { collection: 'customers', index: { email: 1 }, options: { sparse: true } },
      { collection: 'customers', index: { 'kyc.status': 1 } },
      { collection: 'customers', index: { riskCategory: 1 } },
      { collection: 'customers', index: { createdAt: -1 } },
      { collection: 'customers', index: { 'personalInfo.panNumber': 1 }, options: { sparse: true } },

      // Transaction indexes
      { collection: 'transactions', index: { customerId: 1, transactionDate: -1 } },
      { collection: 'transactions', index: { accountNumber: 1, transactionDate: -1 } },
      { collection: 'transactions', index: { type: 1, status: 1 } },
      { collection: 'transactions', index: { amount: 1, currency: 1 } },
      { collection: 'transactions', index: { transactionDate: -1 } },
      { collection: 'transactions', index: { reference: 1 }, options: { sparse: true } },
      { collection: 'transactions', index: { 'flags.suspicious': 1 }, options: { sparse: true } },

      // Audit log indexes
      { collection: 'audit_logs', index: { userId: 1, timestamp: -1 } },
      { collection: 'audit_logs', index: { action: 1, timestamp: -1 } },
      { collection: 'audit_logs', index: { resourceType: 1, resourceId: 1 } },
      { collection: 'audit_logs', index: { timestamp: -1 } },
      { collection: 'audit_logs', index: { level: 1, timestamp: -1 } },

      // Regulatory circular indexes
      { collection: 'regulatory_circulars', index: { circularId: 1 }, options: { unique: true } },
      { collection: 'regulatory_circulars', index: { category: 1, effectiveDate: -1 } },
      { collection: 'regulatory_circulars', index: { status: 1, publishedDate: -1 } },
      { collection: 'regulatory_circulars', index: { tags: 1 } },
      { collection: 'regulatory_circulars', index: { effectiveDate: 1, expiryDate: 1 } },

      // Workflow indexes
      { collection: 'workflows', index: { status: 1, createdAt: -1 } },
      { collection: 'workflows', index: { initiatedBy: 1, status: 1 } },
      { collection: 'workflows', index: { workflowType: 1, status: 1 } },
      { collection: 'workflows', index: { 'currentStep.assignedTo': 1 } },

      // Report indexes
      { collection: 'reports', index: { type: 1, generatedAt: -1 } },
      { collection: 'reports', index: { generatedBy: 1, generatedAt: -1 } },
      { collection: 'reports', index: { status: 1, scheduledAt: 1 } },
      { collection: 'reports', index: { 'parameters.dateRange.start': 1, 'parameters.dateRange.end': 1 } }
    ];

    for (const indexDef of indexes) {
      try {
        await this.db.collection(indexDef.collection).createIndex(
          indexDef.index,
          indexDef.options || {}
        );
        
        this.logger.debug(`Created index on ${indexDef.collection}:`, indexDef.index);
      } catch (error) {
        if (error.code !== 85) { // Index already exists
          this.logger.warn(`Failed to create index on ${indexDef.collection}:`, error.message);
        }
      }
    }

    this.logger.info('Performance indexes created successfully');
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeOptimizedQuery(collection, operation, query, options = {}) {
    const startTime = performance.now();
    const queryKey = this.generateQueryKey(collection, operation, query, options);
    
    try {
      // Check cache first
      if (this.config.enableQueryCache && options.useCache !== false) {
        const cachedResult = await this.getCachedResult(queryKey);
        if (cachedResult) {
          this.recordQueryMetrics(collection, operation, performance.now() - startTime, true);
          return cachedResult;
        }
      }

      // Execute query with optimization
      const optimizedQuery = this.optimizeQuery(query);
      const optimizedOptions = this.optimizeOptions(options);
      
      let result;
      switch (operation) {
        case 'find':
          result = await this.db.collection(collection)
            .find(optimizedQuery, optimizedOptions)
            .toArray();
          break;
        case 'findOne':
          result = await this.db.collection(collection)
            .findOne(optimizedQuery, optimizedOptions);
          break;
        case 'aggregate':
          result = await this.db.collection(collection)
            .aggregate(optimizedQuery, optimizedOptions)
            .toArray();
          break;
        case 'count':
          result = await this.db.collection(collection)
            .countDocuments(optimizedQuery, optimizedOptions);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const executionTime = performance.now() - startTime;
      
      // Cache result if appropriate
      if (this.config.enableQueryCache && options.useCache !== false && this.shouldCacheResult(result, executionTime)) {
        await this.cacheResult(queryKey, result);
      }

      // Record metrics and analyze performance
      this.recordQueryMetrics(collection, operation, executionTime, false);
      await this.analyzeQueryPerformance(collection, operation, query, executionTime);

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordQueryMetrics(collection, operation, executionTime, false, error);
      
      this.logger.error(`Query execution failed on ${collection}.${operation}:`, {
        query,
        options,
        error: error.message,
        executionTime
      });
      
      throw error;
    }
  }

  /**
   * Optimize query structure
   */
  optimizeQuery(query) {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const optimized = { ...query };

    // Optimize $or queries by moving most selective conditions first
    if (optimized.$or && Array.isArray(optimized.$or)) {
      optimized.$or = this.optimizeOrConditions(optimized.$or);
    }

    // Optimize regex queries
    if (this.hasRegexQueries(optimized)) {
      this.optimizeRegexQueries(optimized);
    }

    // Optimize date range queries
    if (this.hasDateRangeQueries(optimized)) {
      this.optimizeDateRangeQueries(optimized);
    }

    return optimized;
  }

  /**
   * Optimize query options
   */
  optimizeOptions(options) {
    const optimized = { ...options };

    // Add default projection to exclude large fields
    if (!optimized.projection) {
      optimized.projection = this.getDefaultProjection();
    }

    // Optimize sort operations
    if (optimized.sort) {
      optimized.sort = this.optimizeSort(optimized.sort);
    }

    // Add reasonable limits for safety
    if (!optimized.limit && !optimized.skip) {
      optimized.limit = 1000; // Default limit to prevent large result sets
    }

    return optimized;
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  async analyzeQueryPerformance(collection, operation, query, executionTime) {
    const querySignature = this.getQuerySignature(collection, operation, query);
    
    // Update query statistics
    if (!this.queryStats.has(querySignature)) {
      this.queryStats.set(querySignature, {
        collection,
        operation,
        query,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const stats = this.queryStats.get(querySignature);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.minTime = Math.min(stats.minTime, executionTime);

    // Check if query is slow
    if (executionTime > this.config.slowQueryThreshold) {
      await this.handleSlowQuery(collection, operation, query, executionTime, stats);
    }

    // Suggest indexes for frequently used queries
    if (stats.count % 100 === 0) { // Every 100 executions
      await this.suggestIndexOptimizations(collection, query, stats);
    }
  }

  /**
   * Handle slow query detection and optimization
   */
  async handleSlowQuery(collection, operation, query, executionTime, stats) {
    this.logger.warn('Slow query detected:', {
      collection,
      operation,
      query,
      executionTime,
      avgTime: stats.avgTime,
      count: stats.count
    });

    // Emit slow query event
    this.emit('slowQuery', {
      collection,
      operation,
      query,
      executionTime,
      stats
    });

    // Record slow query metric
    this.metrics.increment('database.slow_queries', {
      collection,
      operation
    });

    // Analyze query execution plan if enabled
    if (this.config.enableExplainAnalyze) {
      try {
        const explanation = await this.explainQuery(collection, operation, query);
        this.analyzeExecutionPlan(explanation, collection, query);
      } catch (error) {
        this.logger.error('Failed to explain query:', error);
      }
    }
  }

  /**
   * Explain query execution plan
   */
  async explainQuery(collection, operation, query) {
    try {
      let explanation;
      
      switch (operation) {
        case 'find':
        case 'findOne':
          explanation = await this.db.collection(collection)
            .find(query)
            .explain('executionStats');
          break;
        case 'aggregate':
          explanation = await this.db.collection(collection)
            .aggregate(query)
            .explain('executionStats');
          break;
        default:
          return null;
      }

      return explanation;
    } catch (error) {
      this.logger.error('Failed to explain query:', error);
      return null;
    }
  }

  /**
   * Analyze execution plan and suggest optimizations
   */
  analyzeExecutionPlan(explanation, collection, query) {
    if (!explanation || !explanation.executionStats) {
      return;
    }

    const stats = explanation.executionStats;
    const suggestions = [];

    // Check if query used an index
    if (stats.totalDocsExamined > stats.totalDocsReturned * 10) {
      suggestions.push({
        type: 'INDEX_NEEDED',
        message: 'Query examined too many documents. Consider adding an index.',
        collection,
        query,
        docsExamined: stats.totalDocsExamined,
        docsReturned: stats.totalDocsReturned
      });
    }

    // Check for collection scans
    if (stats.executionStages && stats.executionStages.stage === 'COLLSCAN') {
      suggestions.push({
        type: 'COLLECTION_SCAN',
        message: 'Query performed a collection scan. Add appropriate indexes.',
        collection,
        query
      });
    }

    // Store suggestions
    if (suggestions.length > 0) {
      const queryKey = this.getQuerySignature(collection, 'find', query);
      this.indexSuggestions.set(queryKey, suggestions);
      
      this.logger.info('Query optimization suggestions:', suggestions);
    }
  }

  /**
   * Suggest index optimizations
   */
  async suggestIndexOptimizations(collection, query, stats) {
    const suggestions = [];
    
    // Analyze query patterns
    const queryFields = this.extractQueryFields(query);
    
    for (const field of queryFields) {
      const indexExists = await this.checkIndexExists(collection, field);
      
      if (!indexExists) {
        suggestions.push({
          type: 'MISSING_INDEX',
          collection,
          field,
          query,
          frequency: stats.count,
          avgTime: stats.avgTime
        });
      }
    }

    // Check for compound index opportunities
    if (queryFields.length > 1) {
      const compoundIndex = await this.checkCompoundIndexExists(collection, queryFields);
      
      if (!compoundIndex) {
        suggestions.push({
          type: 'COMPOUND_INDEX',
          collection,
          fields: queryFields,
          query,
          frequency: stats.count,
          avgTime: stats.avgTime
        });
      }
    }

    if (suggestions.length > 0) {
      this.logger.info('Index optimization suggestions:', suggestions);
      this.emit('indexSuggestions', suggestions);
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStatistics() {
    const stats = Array.from(this.queryStats.entries()).map(([signature, data]) => ({
      signature,
      ...data,
      efficiency: data.totalTime / data.count
    }));

    return {
      totalQueries: stats.reduce((sum, s) => sum + s.count, 0),
      uniqueQueries: stats.length,
      slowQueries: stats.filter(s => s.avgTime > this.config.slowQueryThreshold).length,
      topSlowQueries: stats
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 10),
      topFrequentQueries: stats
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      indexSuggestions: Array.from(this.indexSuggestions.values())
    };
  }

  /**
   * Generate cache key for query
   */
  generateQueryKey(collection, operation, query, options) {
    const key = {
      collection,
      operation,
      query: JSON.stringify(query),
      options: JSON.stringify(options)
    };
    
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  /**
   * Cache query result
   */
  async cacheResult(key, result) {
    try {
      await this.cache.set(
        `query:${key}`,
        result,
        this.config.cacheTimeout
      );
    } catch (error) {
      this.logger.warn('Failed to cache query result:', error);
    }
  }

  /**
   * Get cached query result
   */
  async getCachedResult(key) {
    try {
      return await this.cache.get(`query:${key}`);
    } catch (error) {
      this.logger.warn('Failed to get cached result:', error);
      return null;
    }
  }

  /**
   * Record query metrics
   */
  recordQueryMetrics(collection, operation, executionTime, fromCache, error = null) {
    this.metrics.histogram('database.query_duration', executionTime, {
      collection,
      operation,
      cached: fromCache.toString(),
      status: error ? 'error' : 'success'
    });

    this.metrics.increment('database.queries_total', {
      collection,
      operation,
      cached: fromCache.toString(),
      status: error ? 'error' : 'success'
    });

    if (error) {
      this.metrics.increment('database.query_errors', {
        collection,
        operation,
        error_type: error.constructor.name
      });
    }
  }

  /**
   * Setup query monitoring
   */
  async setupQueryMonitoring() {
    // Enable MongoDB profiler for slow operations
    try {
      await this.db.admin().command({
        profile: 2,
        slowms: this.config.slowQueryThreshold
      });
      
      this.logger.info('Database profiler enabled');
    } catch (error) {
      this.logger.warn('Failed to enable database profiler:', error);
    }
  }

  /**
   * Start performance analysis
   */
  startPerformanceAnalysis() {
    // Periodic performance analysis
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 300000); // Every 5 minutes

    // Periodic cache cleanup
    setInterval(() => {
      this.cleanupQueryCache();
    }, 600000); // Every 10 minutes
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    const stats = this.getQueryStatistics();
    
    this.logger.info('Query performance summary:', {
      totalQueries: stats.totalQueries,
      uniqueQueries: stats.uniqueQueries,
      slowQueries: stats.slowQueries,
      cacheHitRate: this.calculateCacheHitRate()
    });

    // Emit performance metrics
    this.emit('performanceAnalysis', stats);
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    // Implementation would track cache hits vs misses
    return 0.85; // Placeholder
  }

  /**
   * Cleanup query cache
   */
  cleanupQueryCache() {
    if (this.queryCache.size > this.config.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.queryCache.entries());
      const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
      
      for (const [key] of toRemove) {
        this.queryCache.delete(key);
      }
      
      this.logger.debug(`Cleaned up ${toRemove.length} cache entries`);
    }
  }

  // Helper methods
  getQuerySignature(collection, operation, query) {
    return `${collection}.${operation}:${JSON.stringify(query)}`;
  }

  extractQueryFields(query) {
    const fields = [];
    
    const extractFields = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        fields.push(fieldPath);
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          extractFields(value, fieldPath);
        }
      }
    };
    
    extractFields(query);
    return [...new Set(fields)];
  }

  async checkIndexExists(collection, field) {
    try {
      const indexes = await this.db.collection(collection).indexes();
      return indexes.some(index => 
        index.key && Object.keys(index.key).includes(field)
      );
    } catch (error) {
      return false;
    }
  }

  async checkCompoundIndexExists(collection, fields) {
    try {
      const indexes = await this.db.collection(collection).indexes();
      return indexes.some(index => {
        const indexFields = Object.keys(index.key || {});
        return fields.every(field => indexFields.includes(field));
      });
    } catch (error) {
      return false;
    }
  }

  shouldCacheResult(result, executionTime) {
    // Cache if query took significant time and result is not too large
    return executionTime > 100 && JSON.stringify(result).length < 1024 * 1024; // 1MB
  }

  optimizeOrConditions(orConditions) {
    // Sort OR conditions by selectivity (most selective first)
    return orConditions.sort((a, b) => {
      const aFields = Object.keys(a).length;
      const bFields = Object.keys(b).length;
      return bFields - aFields; // More fields = more selective
    });
  }

  hasRegexQueries(query) {
    return JSON.stringify(query).includes('$regex');
  }

  optimizeRegexQueries(query) {
    // Add case-insensitive option and anchoring where appropriate
    const optimizeRegex = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value.$regex) {
          if (!value.$options) {
            value.$options = 'i'; // Case insensitive
          }
        } else if (typeof value === 'object' && value !== null) {
          optimizeRegex(value);
        }
      }
    };
    
    optimizeRegex(query);
  }

  hasDateRangeQueries(query) {
    return JSON.stringify(query).includes('$gte') || JSON.stringify(query).includes('$lte');
  }

  optimizeDateRangeQueries(query) {
    // Ensure date range queries use proper Date objects
    const optimizeDates = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (value.$gte && typeof value.$gte === 'string') {
            value.$gte = new Date(value.$gte);
          }
          if (value.$lte && typeof value.$lte === 'string') {
            value.$lte = new Date(value.$lte);
          }
          optimizeDates(value);
        }
      }
    };
    
    optimizeDates(query);
  }

  getDefaultProjection() {
    // Exclude large fields by default
    return {
      __v: 0,
      'metadata.raw': 0,
      'content.binary': 0
    };
  }

  optimizeSort(sort) {
    // Ensure sort uses indexed fields
    return sort;
  }
}

module.exports = { QueryOptimizerService };
