// Database Connection Pool Service
// Advanced connection pooling with load balancing and health monitoring

const { MongoClient } = require('mongodb');
const { EventEmitter } = require('events');
const { Logger } = require('../logging/logger.service');
const { MetricsService } = require('../monitoring/metrics.service');

class ConnectionPoolService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.logger = new Logger('ConnectionPool');
    this.metrics = new MetricsService();
    
    this.config = {
      // Primary database configuration
      primaryUri: options.primaryUri || process.env.MONGODB_URI,
      
      // Read replica configuration
      readReplicas: options.readReplicas || [],
      
      // Connection pool settings
      minPoolSize: options.minPoolSize || 5,
      maxPoolSize: options.maxPoolSize || 50,
      maxIdleTimeMS: options.maxIdleTimeMS || 30000,
      waitQueueTimeoutMS: options.waitQueueTimeoutMS || 5000,
      
      // Health check settings
      healthCheckInterval: options.healthCheckInterval || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelayMS: options.retryDelayMS || 1000,
      
      // Load balancing
      readPreference: options.readPreference || 'secondaryPreferred',
      loadBalancingStrategy: options.loadBalancingStrategy || 'round_robin',
      
      // Monitoring
      enableMetrics: options.enableMetrics !== false,
      slowOperationThreshold: options.slowOperationThreshold || 1000,
      
      ...options
    };
    
    this.connections = new Map();
    this.readConnections = [];
    this.currentReadIndex = 0;
    this.connectionHealth = new Map();
    this.operationQueue = [];
    this.isInitialized = false;
    
    this.initializeConnections();
  }

  /**
   * Initialize database connections
   */
  async initializeConnections() {
    try {
      // Initialize primary connection
      await this.initializePrimaryConnection();
      
      // Initialize read replica connections
      await this.initializeReadReplicas();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Start metrics collection
      if (this.config.enableMetrics) {
        this.startMetricsCollection();
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      this.logger.info('Database connection pool initialized successfully', {
        primaryConnected: this.connections.has('primary'),
        readReplicas: this.readConnections.length,
        totalConnections: this.connections.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize connection pool:', error);
      throw error;
    }
  }

  /**
   * Initialize primary database connection
   */
  async initializePrimaryConnection() {
    const clientOptions = {
      minPoolSize: this.config.minPoolSize,
      maxPoolSize: this.config.maxPoolSize,
      maxIdleTimeMS: this.config.maxIdleTimeMS,
      waitQueueTimeoutMS: this.config.waitQueueTimeoutMS,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      readPreference: 'primary',
      w: 'majority',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true }
    };

    const client = new MongoClient(this.config.primaryUri, clientOptions);
    
    try {
      await client.connect();
      await this.validateConnection(client);
      
      this.connections.set('primary', {
        client,
        db: client.db(),
        type: 'primary',
        uri: this.config.primaryUri,
        isHealthy: true,
        lastHealthCheck: new Date(),
        connectionCount: 0,
        errorCount: 0
      });
      
      this.setupConnectionEventHandlers(client, 'primary');
      
      this.logger.info('Primary database connection established');
      
    } catch (error) {
      this.logger.error('Failed to connect to primary database:', error);
      throw error;
    }
  }

  /**
   * Initialize read replica connections
   */
  async initializeReadReplicas() {
    if (!this.config.readReplicas || this.config.readReplicas.length === 0) {
      this.logger.info('No read replicas configured');
      return;
    }

    const clientOptions = {
      minPoolSize: Math.max(1, Math.floor(this.config.minPoolSize / 2)),
      maxPoolSize: Math.max(5, Math.floor(this.config.maxPoolSize / 2)),
      maxIdleTimeMS: this.config.maxIdleTimeMS,
      waitQueueTimeoutMS: this.config.waitQueueTimeoutMS,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryReads: true,
      readPreference: this.config.readPreference,
      readConcern: { level: 'available' }
    };

    for (let i = 0; i < this.config.readReplicas.length; i++) {
      const replicaUri = this.config.readReplicas[i];
      const connectionId = `read_replica_${i}`;
      
      try {
        const client = new MongoClient(replicaUri, clientOptions);
        await client.connect();
        await this.validateConnection(client);
        
        const connection = {
          client,
          db: client.db(),
          type: 'read_replica',
          uri: replicaUri,
          isHealthy: true,
          lastHealthCheck: new Date(),
          connectionCount: 0,
          errorCount: 0,
          weight: 1 // For weighted load balancing
        };
        
        this.connections.set(connectionId, connection);
        this.readConnections.push(connection);
        
        this.setupConnectionEventHandlers(client, connectionId);
        
        this.logger.info(`Read replica ${i + 1} connected successfully`);
        
      } catch (error) {
        this.logger.warn(`Failed to connect to read replica ${i + 1}:`, error);
        // Continue with other replicas
      }
    }
    
    this.logger.info(`Initialized ${this.readConnections.length} read replica connections`);
  }

  /**
   * Get database connection for operation
   */
  getConnection(operation = 'read') {
    if (!this.isInitialized) {
      throw new Error('Connection pool not initialized');
    }

    if (operation === 'write' || operation === 'primary') {
      return this.getPrimaryConnection();
    }
    
    return this.getReadConnection();
  }

  /**
   * Get primary database connection
   */
  getPrimaryConnection() {
    const connection = this.connections.get('primary');
    
    if (!connection || !connection.isHealthy) {
      throw new Error('Primary database connection not available');
    }
    
    connection.connectionCount++;
    this.recordConnectionMetrics('primary', 'primary');
    
    return connection.db;
  }

  /**
   * Get read connection using load balancing
   */
  getReadConnection() {
    // Fallback to primary if no read replicas available
    if (this.readConnections.length === 0) {
      this.logger.debug('No read replicas available, using primary connection');
      return this.getPrimaryConnection();
    }

    // Filter healthy connections
    const healthyConnections = this.readConnections.filter(conn => conn.isHealthy);
    
    if (healthyConnections.length === 0) {
      this.logger.warn('No healthy read replicas available, using primary connection');
      return this.getPrimaryConnection();
    }

    // Select connection based on load balancing strategy
    const connection = this.selectReadConnection(healthyConnections);
    
    if (!connection) {
      return this.getPrimaryConnection();
    }
    
    connection.connectionCount++;
    this.recordConnectionMetrics('read', 'read_replica');
    
    return connection.db;
  }

  /**
   * Select read connection based on load balancing strategy
   */
  selectReadConnection(healthyConnections) {
    switch (this.config.loadBalancingStrategy) {
      case 'round_robin':
        return this.roundRobinSelection(healthyConnections);
      
      case 'least_connections':
        return this.leastConnectionsSelection(healthyConnections);
      
      case 'weighted':
        return this.weightedSelection(healthyConnections);
      
      case 'random':
        return this.randomSelection(healthyConnections);
      
      default:
        return this.roundRobinSelection(healthyConnections);
    }
  }

  /**
   * Round robin connection selection
   */
  roundRobinSelection(connections) {
    const connection = connections[this.currentReadIndex % connections.length];
    this.currentReadIndex = (this.currentReadIndex + 1) % connections.length;
    return connection;
  }

  /**
   * Least connections selection
   */
  leastConnectionsSelection(connections) {
    return connections.reduce((least, current) => 
      current.connectionCount < least.connectionCount ? current : least
    );
  }

  /**
   * Weighted selection
   */
  weightedSelection(connections) {
    const totalWeight = connections.reduce((sum, conn) => sum + conn.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const connection of connections) {
      random -= connection.weight;
      if (random <= 0) {
        return connection;
      }
    }
    
    return connections[0];
  }

  /**
   * Random selection
   */
  randomSelection(connections) {
    const randomIndex = Math.floor(Math.random() * connections.length);
    return connections[randomIndex];
  }

  /**
   * Execute operation with automatic retry and failover
   */
  async executeWithRetry(operation, operationType = 'read', maxRetries = null) {
    const retries = maxRetries || this.config.maxRetries;
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const connection = this.getConnection(operationType);
        
        const result = await operation(connection);
        
        const duration = Date.now() - startTime;
        this.recordOperationMetrics(operationType, duration, 'success');
        
        if (duration > this.config.slowOperationThreshold) {
          this.logger.warn('Slow database operation detected:', {
            operationType,
            duration,
            attempt
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        this.logger.warn(`Database operation failed (attempt ${attempt}/${retries}):`, {
          error: error.message,
          operationType,
          attempt
        });
        
        this.recordOperationMetrics(operationType, 0, 'error');
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retry
        if (attempt < retries) {
          await this.delay(this.config.retryDelayMS * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate database connection
   */
  async validateConnection(client) {
    try {
      await client.db().admin().ping();
      return true;
    } catch (error) {
      throw new Error(`Connection validation failed: ${error.message}`);
    }
  }

  /**
   * Setup connection event handlers
   */
  setupConnectionEventHandlers(client, connectionId) {
    client.on('connectionPoolCreated', () => {
      this.logger.debug(`Connection pool created for ${connectionId}`);
    });

    client.on('connectionPoolClosed', () => {
      this.logger.warn(`Connection pool closed for ${connectionId}`);
      this.markConnectionUnhealthy(connectionId);
    });

    client.on('connectionCreated', () => {
      this.metrics.increment('database.connections_created', { connection: connectionId });
    });

    client.on('connectionClosed', () => {
      this.metrics.increment('database.connections_closed', { connection: connectionId });
    });

    client.on('error', (error) => {
      this.logger.error(`Database connection error for ${connectionId}:`, error);
      this.markConnectionUnhealthy(connectionId);
      this.emit('connectionError', { connectionId, error });
    });

    client.on('timeout', () => {
      this.logger.warn(`Database connection timeout for ${connectionId}`);
      this.metrics.increment('database.connection_timeouts', { connection: connectionId });
    });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    this.logger.info('Health monitoring started');
  }

  /**
   * Perform health checks on all connections
   */
  async performHealthChecks() {
    const healthCheckPromises = Array.from(this.connections.entries()).map(
      ([connectionId, connection]) => this.checkConnectionHealth(connectionId, connection)
    );
    
    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check individual connection health
   */
  async checkConnectionHealth(connectionId, connection) {
    try {
      const startTime = Date.now();
      await connection.client.db().admin().ping();
      const responseTime = Date.now() - startTime;
      
      connection.isHealthy = true;
      connection.lastHealthCheck = new Date();
      
      this.metrics.histogram('database.health_check_duration', responseTime, {
        connection: connectionId
      });
      
      this.logger.debug(`Health check passed for ${connectionId}`, { responseTime });
      
    } catch (error) {
      this.logger.error(`Health check failed for ${connectionId}:`, error);
      this.markConnectionUnhealthy(connectionId);
      
      this.metrics.increment('database.health_check_failures', {
        connection: connectionId
      });
    }
  }

  /**
   * Mark connection as unhealthy
   */
  markConnectionUnhealthy(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isHealthy = false;
      connection.errorCount++;
      
      // Remove from read connections if it's a replica
      if (connection.type === 'read_replica') {
        this.readConnections = this.readConnections.filter(conn => conn !== connection);
      }
      
      this.emit('connectionUnhealthy', { connectionId, connection });
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectConnectionMetrics();
    }, 60000); // Every minute
    
    this.logger.info('Metrics collection started');
  }

  /**
   * Collect connection pool metrics
   */
  collectConnectionMetrics() {
    for (const [connectionId, connection] of this.connections.entries()) {
      this.metrics.gauge('database.connection_pool_size', 
        connection.client.topology?.s?.pool?.totalConnectionCount || 0, {
          connection: connectionId,
          type: connection.type
        });
      
      this.metrics.gauge('database.connection_pool_available',
        connection.client.topology?.s?.pool?.availableConnectionCount || 0, {
          connection: connectionId,
          type: connection.type
        });
      
      this.metrics.gauge('database.connection_usage_count',
        connection.connectionCount, {
          connection: connectionId,
          type: connection.type
        });
    }
    
    this.metrics.gauge('database.healthy_connections',
      Array.from(this.connections.values()).filter(conn => conn.isHealthy).length
    );
  }

  /**
   * Record connection metrics
   */
  recordConnectionMetrics(operationType, connectionType) {
    this.metrics.increment('database.connection_requests', {
      operation_type: operationType,
      connection_type: connectionType
    });
  }

  /**
   * Record operation metrics
   */
  recordOperationMetrics(operationType, duration, status) {
    this.metrics.histogram('database.operation_duration', duration, {
      operation_type: operationType,
      status
    });
    
    this.metrics.increment('database.operations_total', {
      operation_type: operationType,
      status
    });
  }

  /**
   * Check if error is non-retryable
   */
  isNonRetryableError(error) {
    const nonRetryableCodes = [
      11000, // Duplicate key error
      121,   // Document validation failure
      13,    // Unauthorized
      18     // Authentication failed
    ];
    
    return nonRetryableCodes.includes(error.code) ||
           error.message.includes('Authentication failed') ||
           error.message.includes('not authorized');
  }

  /**
   * Get connection pool statistics
   */
  getStatistics() {
    const stats = {
      totalConnections: this.connections.size,
      healthyConnections: Array.from(this.connections.values()).filter(conn => conn.isHealthy).length,
      readReplicas: this.readConnections.length,
      connectionDetails: {}
    };
    
    for (const [connectionId, connection] of this.connections.entries()) {
      stats.connectionDetails[connectionId] = {
        type: connection.type,
        isHealthy: connection.isHealthy,
        connectionCount: connection.connectionCount,
        errorCount: connection.errorCount,
        lastHealthCheck: connection.lastHealthCheck
      };
    }
    
    return stats;
  }

  /**
   * Close all connections
   */
  async close() {
    this.logger.info('Closing all database connections...');
    
    const closePromises = Array.from(this.connections.values()).map(
      connection => connection.client.close()
    );
    
    await Promise.allSettled(closePromises);
    
    this.connections.clear();
    this.readConnections = [];
    this.isInitialized = false;
    
    this.logger.info('All database connections closed');
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { ConnectionPoolService };
