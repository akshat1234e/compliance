// Database Indexing Service
// Intelligent index management and optimization

const { EventEmitter } = require('events');
const { Logger } = require('../logging/logger.service');
const { MetricsService } = require('../monitoring/metrics.service');

class IndexingService extends EventEmitter {
  constructor(databaseConnection, options = {}) {
    super();
    this.db = databaseConnection;
    this.logger = new Logger('IndexingService');
    this.metrics = new MetricsService();
    
    this.config = {
      autoCreateIndexes: options.autoCreateIndexes !== false,
      analyzeIndexUsage: options.analyzeIndexUsage !== false,
      optimizeIndexes: options.optimizeIndexes !== false,
      indexAnalysisInterval: options.indexAnalysisInterval || 3600000, // 1 hour
      unusedIndexThreshold: options.unusedIndexThreshold || 7, // 7 days
      ...options
    };
    
    this.indexDefinitions = new Map();
    this.indexUsageStats = new Map();
    this.indexOptimizationSuggestions = [];
    
    this.initializeIndexing();
  }

  /**
   * Initialize indexing service
   */
  async initializeIndexing() {
    try {
      await this.loadIndexDefinitions();
      
      if (this.config.autoCreateIndexes) {
        await this.createOptimalIndexes();
      }
      
      if (this.config.analyzeIndexUsage) {
        this.startIndexAnalysis();
      }
      
      this.logger.info('Indexing service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize indexing service:', error);
      throw error;
    }
  }

  /**
   * Load index definitions for all collections
   */
  async loadIndexDefinitions() {
    const indexDefinitions = {
      // Users collection indexes
      users: [
        {
          name: 'email_unique',
          key: { email: 1 },
          options: { unique: true, background: true }
        },
        {
          name: 'role_active_compound',
          key: { role: 1, isActive: 1 },
          options: { background: true }
        },
        {
          name: 'employee_id_sparse',
          key: { 'profile.employeeId': 1 },
          options: { sparse: true, background: true }
        },
        {
          name: 'created_at_desc',
          key: { createdAt: -1 },
          options: { background: true }
        },
        {
          name: 'last_login_sparse',
          key: { lastLoginAt: -1 },
          options: { sparse: true, background: true }
        }
      ],

      // Compliance tasks collection indexes
      compliance_tasks: [
        {
          name: 'assignee_status_compound',
          key: { assignedTo: 1, status: 1 },
          options: { background: true }
        },
        {
          name: 'due_date_priority_compound',
          key: { dueDate: 1, priority: 1 },
          options: { background: true }
        },
        {
          name: 'category_status_compound',
          key: { category: 1, status: 1 },
          options: { background: true }
        },
        {
          name: 'assignee_due_date_compound',
          key: { assignedTo: 1, dueDate: 1 },
          options: { background: true }
        },
        {
          name: 'status_updated_compound',
          key: { status: 1, updatedAt: -1 },
          options: { background: true }
        },
        {
          name: 'tags_multikey',
          key: { tags: 1 },
          options: { background: true }
        },
        {
          name: 'created_at_desc',
          key: { createdAt: -1 },
          options: { background: true }
        }
      ],

      // Documents collection indexes
      documents: [
        {
          name: 'uploader_created_compound',
          key: { uploadedBy: 1, createdAt: -1 },
          options: { background: true }
        },
        {
          name: 'type_category_compound',
          key: { type: 1, category: 1 },
          options: { background: true }
        },
        {
          name: 'classification_index',
          key: { 'metadata.classification': 1 },
          options: { background: true }
        },
        {
          name: 'tags_multikey',
          key: { tags: 1 },
          options: { background: true }
        },
        {
          name: 'text_search',
          key: { fileName: 'text', title: 'text', description: 'text' },
          options: { 
            background: true,
            weights: { title: 10, fileName: 5, description: 1 }
          }
        },
        {
          name: 'status_created_compound',
          key: { status: 1, createdAt: -1 },
          options: { background: true }
        }
      ],

      // Customers collection indexes
      customers: [
        {
          name: 'customer_id_unique',
          key: { customerId: 1 },
          options: { unique: true, background: true }
        },
        {
          name: 'email_sparse',
          key: { email: 1 },
          options: { sparse: true, background: true }
        },
        {
          name: 'kyc_status_index',
          key: { 'kyc.status': 1 },
          options: { background: true }
        },
        {
          name: 'risk_category_index',
          key: { riskCategory: 1 },
          options: { background: true }
        },
        {
          name: 'pan_number_sparse',
          key: { 'personalInfo.panNumber': 1 },
          options: { sparse: true, background: true }
        },
        {
          name: 'created_at_desc',
          key: { createdAt: -1 },
          options: { background: true }
        }
      ],

      // Transactions collection indexes
      transactions: [
        {
          name: 'customer_date_compound',
          key: { customerId: 1, transactionDate: -1 },
          options: { background: true }
        },
        {
          name: 'account_date_compound',
          key: { accountNumber: 1, transactionDate: -1 },
          options: { background: true }
        },
        {
          name: 'type_status_compound',
          key: { type: 1, status: 1 },
          options: { background: true }
        },
        {
          name: 'amount_currency_compound',
          key: { amount: 1, currency: 1 },
          options: { background: true }
        },
        {
          name: 'transaction_date_desc',
          key: { transactionDate: -1 },
          options: { background: true }
        },
        {
          name: 'reference_sparse',
          key: { reference: 1 },
          options: { sparse: true, background: true }
        },
        {
          name: 'suspicious_flag_sparse',
          key: { 'flags.suspicious': 1 },
          options: { sparse: true, background: true }
        }
      ],

      // Audit logs collection indexes
      audit_logs: [
        {
          name: 'user_timestamp_compound',
          key: { userId: 1, timestamp: -1 },
          options: { background: true }
        },
        {
          name: 'action_timestamp_compound',
          key: { action: 1, timestamp: -1 },
          options: { background: true }
        },
        {
          name: 'resource_compound',
          key: { resourceType: 1, resourceId: 1 },
          options: { background: true }
        },
        {
          name: 'timestamp_desc',
          key: { timestamp: -1 },
          options: { background: true }
        },
        {
          name: 'level_timestamp_compound',
          key: { level: 1, timestamp: -1 },
          options: { background: true }
        },
        {
          name: 'ttl_index',
          key: { timestamp: 1 },
          options: { 
            background: true,
            expireAfterSeconds: 31536000 // 1 year
          }
        }
      ],

      // Regulatory circulars collection indexes
      regulatory_circulars: [
        {
          name: 'circular_id_unique',
          key: { circularId: 1 },
          options: { unique: true, background: true }
        },
        {
          name: 'category_effective_compound',
          key: { category: 1, effectiveDate: -1 },
          options: { background: true }
        },
        {
          name: 'status_published_compound',
          key: { status: 1, publishedDate: -1 },
          options: { background: true }
        },
        {
          name: 'tags_multikey',
          key: { tags: 1 },
          options: { background: true }
        },
        {
          name: 'effective_expiry_compound',
          key: { effectiveDate: 1, expiryDate: 1 },
          options: { background: true }
        }
      ],

      // Workflows collection indexes
      workflows: [
        {
          name: 'status_created_compound',
          key: { status: 1, createdAt: -1 },
          options: { background: true }
        },
        {
          name: 'initiator_status_compound',
          key: { initiatedBy: 1, status: 1 },
          options: { background: true }
        },
        {
          name: 'type_status_compound',
          key: { workflowType: 1, status: 1 },
          options: { background: true }
        },
        {
          name: 'current_step_assignee',
          key: { 'currentStep.assignedTo': 1 },
          options: { background: true }
        }
      ],

      // Reports collection indexes
      reports: [
        {
          name: 'type_generated_compound',
          key: { type: 1, generatedAt: -1 },
          options: { background: true }
        },
        {
          name: 'generator_generated_compound',
          key: { generatedBy: 1, generatedAt: -1 },
          options: { background: true }
        },
        {
          name: 'status_scheduled_compound',
          key: { status: 1, scheduledAt: 1 },
          options: { background: true }
        },
        {
          name: 'date_range_compound',
          key: { 
            'parameters.dateRange.start': 1, 
            'parameters.dateRange.end': 1 
          },
          options: { background: true }
        }
      ]
    };

    // Store index definitions
    for (const [collection, indexes] of Object.entries(indexDefinitions)) {
      this.indexDefinitions.set(collection, indexes);
    }

    this.logger.info(`Loaded index definitions for ${Object.keys(indexDefinitions).length} collections`);
  }

  /**
   * Create optimal indexes for all collections
   */
  async createOptimalIndexes() {
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [collectionName, indexes] of this.indexDefinitions.entries()) {
      for (const indexDef of indexes) {
        try {
          const exists = await this.indexExists(collectionName, indexDef.name);
          
          if (!exists) {
            await this.createIndex(collectionName, indexDef);
            createdCount++;
            
            this.logger.debug(`Created index ${indexDef.name} on ${collectionName}`);
          } else {
            skippedCount++;
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to create index ${indexDef.name} on ${collectionName}:`, error);
        }
      }
    }

    this.logger.info('Index creation completed:', {
      created: createdCount,
      skipped: skippedCount,
      errors: errorCount
    });

    this.metrics.gauge('database.indexes_created', createdCount);
    this.metrics.gauge('database.indexes_skipped', skippedCount);
    this.metrics.gauge('database.index_errors', errorCount);
  }

  /**
   * Create a single index
   */
  async createIndex(collectionName, indexDef) {
    try {
      const startTime = Date.now();
      
      await this.db.collection(collectionName).createIndex(
        indexDef.key,
        { name: indexDef.name, ...indexDef.options }
      );
      
      const duration = Date.now() - startTime;
      
      this.metrics.histogram('database.index_creation_duration', duration, {
        collection: collectionName,
        index: indexDef.name
      });
      
      this.emit('indexCreated', {
        collection: collectionName,
        index: indexDef.name,
        duration
      });
      
    } catch (error) {
      this.metrics.increment('database.index_creation_errors', {
        collection: collectionName,
        index: indexDef.name
      });
      
      throw error;
    }
  }

  /**
   * Check if index exists
   */
  async indexExists(collectionName, indexName) {
    try {
      const indexes = await this.db.collection(collectionName).indexes();
      return indexes.some(index => index.name === indexName);
    } catch (error) {
      this.logger.warn(`Failed to check index existence for ${collectionName}.${indexName}:`, error);
      return false;
    }
  }

  /**
   * Start index usage analysis
   */
  startIndexAnalysis() {
    setInterval(async () => {
      await this.analyzeIndexUsage();
    }, this.config.indexAnalysisInterval);
    
    this.logger.info('Index usage analysis started');
  }

  /**
   * Analyze index usage across all collections
   */
  async analyzeIndexUsage() {
    try {
      const collections = await this.db.listCollections().toArray();
      
      for (const collection of collections) {
        await this.analyzeCollectionIndexes(collection.name);
      }
      
      await this.generateOptimizationSuggestions();
      
    } catch (error) {
      this.logger.error('Failed to analyze index usage:', error);
    }
  }

  /**
   * Analyze indexes for a specific collection
   */
  async analyzeCollectionIndexes(collectionName) {
    try {
      const stats = await this.db.collection(collectionName).aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      for (const indexStat of stats) {
        const indexName = indexStat.name;
        const usage = {
          collection: collectionName,
          index: indexName,
          accesses: indexStat.accesses,
          lastAccessed: indexStat.accesses.since || null,
          size: indexStat.size || 0
        };
        
        this.indexUsageStats.set(`${collectionName}.${indexName}`, usage);
        
        // Record metrics
        this.metrics.gauge('database.index_accesses', indexStat.accesses.ops || 0, {
          collection: collectionName,
          index: indexName
        });
      }
      
    } catch (error) {
      this.logger.warn(`Failed to analyze indexes for ${collectionName}:`, error);
    }
  }

  /**
   * Generate index optimization suggestions
   */
  async generateOptimizationSuggestions() {
    const suggestions = [];
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (this.config.unusedIndexThreshold * 24 * 60 * 60 * 1000));
    
    for (const [indexKey, usage] of this.indexUsageStats.entries()) {
      // Check for unused indexes
      if (!usage.lastAccessed || new Date(usage.lastAccessed) < thresholdDate) {
        suggestions.push({
          type: 'UNUSED_INDEX',
          collection: usage.collection,
          index: usage.index,
          message: `Index ${usage.index} has not been used recently`,
          lastAccessed: usage.lastAccessed,
          recommendation: 'Consider dropping this index if it\'s not needed'
        });
      }
      
      // Check for oversized indexes
      if (usage.size > 100 * 1024 * 1024) { // 100MB
        suggestions.push({
          type: 'LARGE_INDEX',
          collection: usage.collection,
          index: usage.index,
          size: usage.size,
          message: `Index ${usage.index} is very large (${Math.round(usage.size / 1024 / 1024)}MB)`,
          recommendation: 'Review index definition and consider optimization'
        });
      }
    }
    
    // Check for missing indexes based on query patterns
    await this.suggestMissingIndexes(suggestions);
    
    this.indexOptimizationSuggestions = suggestions;
    
    if (suggestions.length > 0) {
      this.logger.info(`Generated ${suggestions.length} index optimization suggestions`);
      this.emit('optimizationSuggestions', suggestions);
    }
  }

  /**
   * Suggest missing indexes based on query patterns
   */
  async suggestMissingIndexes(suggestions) {
    // This would analyze slow query logs and suggest indexes
    // Implementation would depend on query pattern analysis
    
    const commonQueryPatterns = [
      {
        collection: 'compliance_tasks',
        pattern: { assignedTo: 1, createdAt: -1 },
        suggestion: 'Consider compound index on assignedTo and createdAt for user task queries'
      },
      {
        collection: 'transactions',
        pattern: { customerId: 1, amount: -1 },
        suggestion: 'Consider compound index on customerId and amount for customer transaction analysis'
      }
    ];
    
    for (const pattern of commonQueryPatterns) {
      const indexExists = await this.compoundIndexExists(pattern.collection, pattern.pattern);
      
      if (!indexExists) {
        suggestions.push({
          type: 'MISSING_INDEX',
          collection: pattern.collection,
          pattern: pattern.pattern,
          message: pattern.suggestion,
          recommendation: 'Create compound index for better query performance'
        });
      }
    }
  }

  /**
   * Check if compound index exists
   */
  async compoundIndexExists(collectionName, pattern) {
    try {
      const indexes = await this.db.collection(collectionName).indexes();
      const patternKeys = Object.keys(pattern);
      
      return indexes.some(index => {
        const indexKeys = Object.keys(index.key || {});
        return patternKeys.every(key => indexKeys.includes(key));
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get index statistics
   */
  getIndexStatistics() {
    const stats = {
      totalIndexes: this.indexUsageStats.size,
      collections: new Set(),
      unusedIndexes: 0,
      largeIndexes: 0,
      totalSize: 0
    };
    
    for (const usage of this.indexUsageStats.values()) {
      stats.collections.add(usage.collection);
      stats.totalSize += usage.size || 0;
      
      if (!usage.lastAccessed) {
        stats.unusedIndexes++;
      }
      
      if (usage.size > 100 * 1024 * 1024) {
        stats.largeIndexes++;
      }
    }
    
    stats.collections = stats.collections.size;
    
    return {
      ...stats,
      optimizationSuggestions: this.indexOptimizationSuggestions.length,
      suggestions: this.indexOptimizationSuggestions
    };
  }

  /**
   * Drop unused indexes
   */
  async dropUnusedIndexes(dryRun = true) {
    const droppedIndexes = [];
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (this.config.unusedIndexThreshold * 24 * 60 * 60 * 1000));
    
    for (const [indexKey, usage] of this.indexUsageStats.entries()) {
      if (!usage.lastAccessed || new Date(usage.lastAccessed) < thresholdDate) {
        // Skip system indexes
        if (usage.index === '_id_' || usage.index.startsWith('_')) {
          continue;
        }
        
        if (dryRun) {
          droppedIndexes.push({
            collection: usage.collection,
            index: usage.index,
            action: 'would_drop'
          });
        } else {
          try {
            await this.db.collection(usage.collection).dropIndex(usage.index);
            droppedIndexes.push({
              collection: usage.collection,
              index: usage.index,
              action: 'dropped'
            });
            
            this.logger.info(`Dropped unused index ${usage.index} from ${usage.collection}`);
          } catch (error) {
            this.logger.error(`Failed to drop index ${usage.index} from ${usage.collection}:`, error);
          }
        }
      }
    }
    
    return droppedIndexes;
  }

  /**
   * Rebuild indexes for a collection
   */
  async rebuildIndexes(collectionName) {
    try {
      const startTime = Date.now();
      
      await this.db.collection(collectionName).reIndex();
      
      const duration = Date.now() - startTime;
      
      this.logger.info(`Rebuilt indexes for ${collectionName}`, { duration });
      
      this.metrics.histogram('database.index_rebuild_duration', duration, {
        collection: collectionName
      });
      
      this.emit('indexesRebuilt', {
        collection: collectionName,
        duration
      });
      
    } catch (error) {
      this.logger.error(`Failed to rebuild indexes for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get collection index information
   */
  async getCollectionIndexes(collectionName) {
    try {
      const indexes = await this.db.collection(collectionName).indexes();
      const stats = await this.db.collection(collectionName).aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      return indexes.map(index => {
        const stat = stats.find(s => s.name === index.name);
        return {
          ...index,
          usage: stat ? {
            accesses: stat.accesses.ops || 0,
            lastAccessed: stat.accesses.since,
            size: stat.size || 0
          } : null
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get indexes for ${collectionName}:`, error);
      throw error;
    }
  }
}

module.exports = { IndexingService };
