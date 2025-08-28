// Optimized Base Repository
// High-performance repository with built-in query optimization

const { ObjectId } = require('mongodb');
const { QueryOptimizerService } = require('../services/database/query-optimizer.service');
const { Logger } = require('../services/logging/logger.service');
const { MetricsService } = require('../services/monitoring/metrics.service');
const { CacheService } = require('../services/cache/cache.service');

class OptimizedBaseRepository {
  constructor(collection, options = {}) {
    this.collection = collection;
    this.collectionName = collection.collectionName;
    this.logger = new Logger(`Repository:${this.collectionName}`);
    this.metrics = new MetricsService();
    this.cache = new CacheService();
    
    this.config = {
      enableQueryOptimization: options.enableQueryOptimization !== false,
      enableCaching: options.enableCaching !== false,
      enableMetrics: options.enableMetrics !== false,
      cacheTimeout: options.cacheTimeout || 300, // 5 minutes
      maxCacheSize: options.maxCacheSize || 1000,
      enableQueryLogging: options.enableQueryLogging || false,
      ...options
    };
    
    // Initialize query optimizer if enabled
    if (this.config.enableQueryOptimization) {
      this.queryOptimizer = new QueryOptimizerService(collection.db, this.config);
    }
    
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  /**
   * Optimized find operation
   */
  async find(query = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey('find', query, options);
      
      // Check cache first
      if (this.config.enableCaching && options.useCache !== false) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.recordMetrics('find', Date.now() - startTime, true);
          return cachedResult;
        }
      }
      
      // Optimize query
      const optimizedQuery = this.optimizeQuery(query);
      const optimizedOptions = this.optimizeOptions(options);
      
      // Execute query
      let result;
      if (this.config.enableQueryOptimization) {
        result = await this.queryOptimizer.executeOptimizedQuery(
          this.collectionName,
          'find',
          optimizedQuery,
          optimizedOptions
        );
      } else {
        result = await this.collection
          .find(optimizedQuery, optimizedOptions)
          .toArray();
      }
      
      // Cache result if appropriate
      if (this.config.enableCaching && this.shouldCacheResult(result, options)) {
        await this.cacheResult(cacheKey, result);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('find', duration, false);
      this.updateQueryStats('find', query, duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('find', duration, false, error);
      this.logger.error('Find operation failed:', { query, options, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized findOne operation
   */
  async findOne(query = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.generateCacheKey('findOne', query, options);
      
      if (this.config.enableCaching && options.useCache !== false) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.recordMetrics('findOne', Date.now() - startTime, true);
          return cachedResult;
        }
      }
      
      const optimizedQuery = this.optimizeQuery(query);
      const optimizedOptions = this.optimizeOptions(options);
      
      let result;
      if (this.config.enableQueryOptimization) {
        result = await this.queryOptimizer.executeOptimizedQuery(
          this.collectionName,
          'findOne',
          optimizedQuery,
          optimizedOptions
        );
      } else {
        result = await this.collection.findOne(optimizedQuery, optimizedOptions);
      }
      
      if (this.config.enableCaching && result && this.shouldCacheResult(result, options)) {
        await this.cacheResult(cacheKey, result);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('findOne', duration, false);
      this.updateQueryStats('findOne', query, duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('findOne', duration, false, error);
      this.logger.error('FindOne operation failed:', { query, options, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized findById operation
   */
  async findById(id, options = {}) {
    const objectId = this.ensureObjectId(id);
    return this.findOne({ _id: objectId }, options);
  }

  /**
   * Optimized aggregate operation
   */
  async aggregate(pipeline = [], options = {}) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.generateCacheKey('aggregate', pipeline, options);
      
      if (this.config.enableCaching && options.useCache !== false) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult) {
          this.recordMetrics('aggregate', Date.now() - startTime, true);
          return cachedResult;
        }
      }
      
      const optimizedPipeline = this.optimizeAggregationPipeline(pipeline);
      const optimizedOptions = this.optimizeOptions(options);
      
      let result;
      if (this.config.enableQueryOptimization) {
        result = await this.queryOptimizer.executeOptimizedQuery(
          this.collectionName,
          'aggregate',
          optimizedPipeline,
          optimizedOptions
        );
      } else {
        result = await this.collection
          .aggregate(optimizedPipeline, optimizedOptions)
          .toArray();
      }
      
      if (this.config.enableCaching && this.shouldCacheResult(result, options)) {
        await this.cacheResult(cacheKey, result);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('aggregate', duration, false);
      this.updateQueryStats('aggregate', pipeline, duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('aggregate', duration, false, error);
      this.logger.error('Aggregate operation failed:', { pipeline, options, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized count operation
   */
  async count(query = {}, options = {}) {
    const startTime = Date.now();
    
    try {
      const cacheKey = this.generateCacheKey('count', query, options);
      
      if (this.config.enableCaching && options.useCache !== false) {
        const cachedResult = await this.getCachedResult(cacheKey);
        if (cachedResult !== null) {
          this.recordMetrics('count', Date.now() - startTime, true);
          return cachedResult;
        }
      }
      
      const optimizedQuery = this.optimizeQuery(query);
      
      let result;
      if (this.config.enableQueryOptimization) {
        result = await this.queryOptimizer.executeOptimizedQuery(
          this.collectionName,
          'count',
          optimizedQuery,
          options
        );
      } else {
        result = await this.collection.countDocuments(optimizedQuery, options);
      }
      
      if (this.config.enableCaching) {
        await this.cacheResult(cacheKey, result);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('count', duration, false);
      this.updateQueryStats('count', query, duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('count', duration, false, error);
      this.logger.error('Count operation failed:', { query, options, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized create operation
   */
  async create(document, options = {}) {
    const startTime = Date.now();
    
    try {
      // Add timestamps
      const now = new Date();
      const documentWithTimestamps = {
        ...document,
        createdAt: document.createdAt || now,
        updatedAt: document.updatedAt || now
      };
      
      const result = await this.collection.insertOne(documentWithTimestamps, options);
      
      // Invalidate related cache entries
      if (this.config.enableCaching) {
        await this.invalidateCache('create');
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('create', duration, false);
      
      return {
        ...documentWithTimestamps,
        _id: result.insertedId
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('create', duration, false, error);
      this.logger.error('Create operation failed:', { document, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized update operation
   */
  async update(query, update, options = {}) {
    const startTime = Date.now();
    
    try {
      // Add updated timestamp
      const updateWithTimestamp = {
        ...update,
        $set: {
          ...update.$set,
          updatedAt: new Date()
        }
      };
      
      const result = await this.collection.updateMany(query, updateWithTimestamp, options);
      
      // Invalidate related cache entries
      if (this.config.enableCaching) {
        await this.invalidateCache('update', query);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('update', duration, false);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('update', duration, false, error);
      this.logger.error('Update operation failed:', { query, update, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized updateById operation
   */
  async updateById(id, update, options = {}) {
    const objectId = this.ensureObjectId(id);
    const result = await this.update({ _id: objectId }, update, options);
    
    if (result.matchedCount === 0) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    return result;
  }

  /**
   * Optimized delete operation
   */
  async delete(query, options = {}) {
    const startTime = Date.now();
    
    try {
      const result = await this.collection.deleteMany(query, options);
      
      // Invalidate related cache entries
      if (this.config.enableCaching) {
        await this.invalidateCache('delete', query);
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('delete', duration, false);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('delete', duration, false, error);
      this.logger.error('Delete operation failed:', { query, error: error.message });
      throw error;
    }
  }

  /**
   * Optimized deleteById operation
   */
  async deleteById(id, options = {}) {
    const objectId = this.ensureObjectId(id);
    const result = await this.delete({ _id: objectId }, options);
    
    if (result.deletedCount === 0) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    return result;
  }

  /**
   * Paginated find with optimization
   */
  async findPaginated(query = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      ...otherOptions
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Execute count and find in parallel
    const [total, documents] = await Promise.all([
      this.count(query),
      this.find(query, {
        ...otherOptions,
        sort,
        skip,
        limit
      })
    ]);
    
    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Bulk operations with optimization
   */
  async bulkWrite(operations, options = {}) {
    const startTime = Date.now();
    
    try {
      // Add timestamps to insert and update operations
      const optimizedOperations = operations.map(op => {
        if (op.insertOne) {
          const now = new Date();
          op.insertOne.document = {
            ...op.insertOne.document,
            createdAt: op.insertOne.document.createdAt || now,
            updatedAt: op.insertOne.document.updatedAt || now
          };
        } else if (op.updateOne || op.updateMany) {
          const updateOp = op.updateOne || op.updateMany;
          updateOp.update = {
            ...updateOp.update,
            $set: {
              ...updateOp.update.$set,
              updatedAt: new Date()
            }
          };
        }
        return op;
      });
      
      const result = await this.collection.bulkWrite(optimizedOperations, options);
      
      // Invalidate cache for bulk operations
      if (this.config.enableCaching) {
        await this.invalidateCache('bulk');
      }
      
      const duration = Date.now() - startTime;
      this.recordMetrics('bulkWrite', duration, false);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetrics('bulkWrite', duration, false, error);
      this.logger.error('Bulk write operation failed:', { operations: operations.length, error: error.message });
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

    // Convert string IDs to ObjectIds
    if (optimized._id && typeof optimized._id === 'string') {
      optimized._id = this.ensureObjectId(optimized._id);
    }

    // Optimize date queries
    this.optimizeDateQueries(optimized);

    // Optimize regex queries
    this.optimizeRegexQueries(optimized);

    return optimized;
  }

  /**
   * Optimize query options
   */
  optimizeOptions(options) {
    const optimized = { ...options };

    // Add default projection to exclude large fields
    if (!optimized.projection && !optimized.select) {
      optimized.projection = this.getDefaultProjection();
    }

    // Ensure reasonable limits
    if (optimized.limit && optimized.limit > 1000) {
      this.logger.warn(`Large limit detected: ${optimized.limit}, capping at 1000`);
      optimized.limit = 1000;
    }

    return optimized;
  }

  /**
   * Optimize aggregation pipeline
   */
  optimizeAggregationPipeline(pipeline) {
    if (!Array.isArray(pipeline)) {
      return pipeline;
    }

    const optimized = [...pipeline];

    // Move $match stages to the beginning
    const matchStages = optimized.filter(stage => stage.$match);
    const otherStages = optimized.filter(stage => !stage.$match);
    
    if (matchStages.length > 0) {
      return [...matchStages, ...otherStages];
    }

    return optimized;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(operation, query, options) {
    const key = {
      collection: this.collectionName,
      operation,
      query: JSON.stringify(query),
      options: JSON.stringify(options)
    };
    
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  /**
   * Cache result
   */
  async cacheResult(key, result) {
    if (!this.config.enableCaching) return;
    
    try {
      await this.cache.set(
        `repo:${this.collectionName}:${key}`,
        result,
        this.config.cacheTimeout
      );
    } catch (error) {
      this.logger.warn('Failed to cache result:', error);
    }
  }

  /**
   * Get cached result
   */
  async getCachedResult(key) {
    if (!this.config.enableCaching) return null;
    
    try {
      return await this.cache.get(`repo:${this.collectionName}:${key}`);
    } catch (error) {
      this.logger.warn('Failed to get cached result:', error);
      return null;
    }
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(operation, query = null) {
    if (!this.config.enableCaching) return;
    
    try {
      // Invalidate all cache entries for this collection
      await this.cache.deletePattern(`repo:${this.collectionName}:*`);
    } catch (error) {
      this.logger.warn('Failed to invalidate cache:', error);
    }
  }

  /**
   * Should cache result
   */
  shouldCacheResult(result, options) {
    if (!this.config.enableCaching || options.useCache === false) {
      return false;
    }
    
    // Don't cache very large results
    const resultSize = JSON.stringify(result).length;
    if (resultSize > 1024 * 1024) { // 1MB
      return false;
    }
    
    return true;
  }

  /**
   * Record metrics
   */
  recordMetrics(operation, duration, fromCache, error = null) {
    if (!this.config.enableMetrics) return;
    
    this.metrics.histogram('repository.operation_duration', duration, {
      collection: this.collectionName,
      operation,
      cached: fromCache.toString(),
      status: error ? 'error' : 'success'
    });
    
    this.metrics.increment('repository.operations_total', {
      collection: this.collectionName,
      operation,
      cached: fromCache.toString(),
      status: error ? 'error' : 'success'
    });
    
    if (error) {
      this.metrics.increment('repository.operation_errors', {
        collection: this.collectionName,
        operation,
        error_type: error.constructor.name
      });
    }
  }

  /**
   * Update query statistics
   */
  updateQueryStats(operation, query, duration) {
    const signature = this.getQuerySignature(operation, query);
    
    if (!this.queryStats.has(signature)) {
      this.queryStats.set(signature, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity
      });
    }
    
    const stats = this.queryStats.get(signature);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);
  }

  /**
   * Get query signature
   */
  getQuerySignature(operation, query) {
    return `${operation}:${JSON.stringify(query)}`;
  }

  /**
   * Ensure ObjectId
   */
  ensureObjectId(id) {
    if (ObjectId.isValid(id)) {
      return typeof id === 'string' ? new ObjectId(id) : id;
    }
    throw new Error(`Invalid ObjectId: ${id}`);
  }

  /**
   * Optimize date queries
   */
  optimizeDateQueries(query) {
    const optimizeDates = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (value.$gte && typeof value.$gte === 'string') {
            value.$gte = new Date(value.$gte);
          }
          if (value.$lte && typeof value.$lte === 'string') {
            value.$lte = new Date(value.$lte);
          }
          if (value.$gt && typeof value.$gt === 'string') {
            value.$gt = new Date(value.$gt);
          }
          if (value.$lt && typeof value.$lt === 'string') {
            value.$lt = new Date(value.$lt);
          }
          optimizeDates(value);
        }
      }
    };
    
    optimizeDates(query);
  }

  /**
   * Optimize regex queries
   */
  optimizeRegexQueries(query) {
    const optimizeRegex = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (value.$regex && !value.$options) {
            value.$options = 'i'; // Case insensitive by default
          }
          optimizeRegex(value);
        }
      }
    };
    
    optimizeRegex(query);
  }

  /**
   * Get default projection
   */
  getDefaultProjection() {
    return {
      __v: 0 // Exclude version field by default
    };
  }

  /**
   * Get repository statistics
   */
  getStatistics() {
    return {
      collection: this.collectionName,
      queryStats: Array.from(this.queryStats.entries()).map(([signature, stats]) => ({
        signature,
        ...stats
      })),
      cacheSize: this.queryCache.size,
      config: this.config
    };
  }
}

module.exports = { OptimizedBaseRepository };
