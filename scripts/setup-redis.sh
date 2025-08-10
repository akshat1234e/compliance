#!/bin/bash

# =============================================================================
# Redis Cache Setup Script
# Enterprise RBI Compliance Management Platform
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Redis connection parameters
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

# Function to check if Redis is running
check_redis() {
    print_status "Checking Redis connection..."
    
    if docker exec rbi-redis redis-cli ping | grep -q "PONG"; then
        print_success "Redis is running and accessible"
        return 0
    else
        print_error "Redis is not accessible. Please ensure Docker containers are running."
        print_status "Try running: ./scripts/docker-dev.sh start"
        return 1
    fi
}

# Function to execute Redis command
execute_redis_command() {
    local command=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if docker exec rbi-redis redis-cli $command > /dev/null 2>&1; then
        print_success "Successfully executed: $description"
        return 0
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to setup Redis configuration
setup_redis_config() {
    print_header "CONFIGURING REDIS"
    
    print_status "Setting up Redis key namespaces and configurations..."
    
    # Set up key expiration policies
    execute_redis_command "CONFIG SET maxmemory-policy allkeys-lru" "Setting memory eviction policy"
    
    # Configure save intervals for persistence
    execute_redis_command "CONFIG SET save '900 1 300 10 60 10000'" "Configuring persistence intervals"
    
    # Set up key namespaces by creating sample keys with TTL
    docker exec rbi-redis redis-cli << 'EOF'
# Session management keys (expire in 24 hours)
SET "session:sample" "sample_session_data" EX 86400

# Cache keys (expire in 1 hour)
SET "cache:sample" "sample_cache_data" EX 3600

# Real-time data keys (expire in 5 minutes)
SET "realtime:sample" "sample_realtime_data" EX 300

# Workflow state keys (expire in 7 days)
SET "workflow:sample" "sample_workflow_state" EX 604800

# Compliance metrics keys (expire in 1 day)
SET "metrics:sample" "sample_metrics_data" EX 86400

# Risk calculation cache (expire in 4 hours)
SET "risk:sample" "sample_risk_data" EX 14400

# Document processing queue
LPUSH "queue:document_processing" "sample_document_job"

# Notification queue
LPUSH "queue:notifications" "sample_notification"

# Real-time alerts
LPUSH "alerts:compliance" "sample_compliance_alert"

# User activity tracking
SET "activity:user:sample" "last_activity_timestamp" EX 3600

# API rate limiting counters
SET "ratelimit:api:sample" "1" EX 60

# Temporary data storage
SET "temp:upload:sample" "temporary_upload_data" EX 1800

EOF

    print_success "Redis configuration completed"
}

# Function to create Redis data structures
setup_data_structures() {
    print_header "SETTING UP REDIS DATA STRUCTURES"
    
    print_status "Creating Redis data structures for the application..."
    
    docker exec rbi-redis redis-cli << 'EOF'
# Hash for user sessions
HSET "sessions:active" "user:123" "session_data_123"
HSET "sessions:active" "user:456" "session_data_456"

# Sorted set for compliance scores (organization_id -> score)
ZADD "compliance:scores" 85.5 "org:demo_bank"
ZADD "compliance:scores" 92.3 "org:test_nbfc"
ZADD "compliance:scores" 78.9 "org:sample_fi"

# Set for active workflow instances
SADD "workflows:active" "workflow:123" "workflow:456" "workflow:789"

# List for recent regulatory changes
LPUSH "regulatory:recent_changes" '{"id":"change:001","title":"New Capital Adequacy Guidelines","date":"2024-01-15"}'
LPUSH "regulatory:recent_changes" '{"id":"change:002","title":"Updated KYC Requirements","date":"2024-01-10"}'

# Hash for risk metrics cache
HSET "risk:metrics:org:demo_bank" "operational_risk" "75.2"
HSET "risk:metrics:org:demo_bank" "credit_risk" "68.9"
HSET "risk:metrics:org:demo_bank" "market_risk" "82.1"

# Sorted set for task priorities
ZADD "tasks:priority" 1 "task:urgent:001"
ZADD "tasks:priority" 2 "task:high:002"
ZADD "tasks:priority" 3 "task:medium:003"

# Set for online users
SADD "users:online" "user:123" "user:456"

# Hash for application configuration
HSET "config:app" "maintenance_mode" "false"
HSET "config:app" "max_file_size" "50MB"
HSET "config:app" "session_timeout" "3600"

# Geospatial data for organization locations (if needed)
GEOADD "organizations:locations" 77.2090 28.6139 "org:demo_bank"
GEOADD "organizations:locations" 72.8777 19.0760 "org:test_nbfc"

EOF

    print_success "Data structures created successfully"
}

# Function to setup Redis monitoring
setup_monitoring() {
    print_header "SETTING UP REDIS MONITORING"
    
    print_status "Configuring Redis monitoring and alerting..."
    
    # Enable Redis slow log
    execute_redis_command "CONFIG SET slowlog-log-slower-than 10000" "Enabling slow query logging"
    execute_redis_command "CONFIG SET slowlog-max-len 128" "Setting slow log max length"
    
    # Set up key space notifications for monitoring
    execute_redis_command "CONFIG SET notify-keyspace-events Ex" "Enabling keyspace notifications for expired keys"
    
    print_success "Monitoring configuration completed"
}

# Function to run Redis tests
run_redis_tests() {
    print_status "Running Redis tests..."
    
    print_status "Test results:"
    
    docker exec rbi-redis redis-cli << 'EOF'
ECHO "=== Redis Database Tests ==="

# Test 1: Basic connectivity
PING

# Test 2: String operations
SET "test:string" "Hello Redis"
GET "test:string"

# Test 3: Hash operations
HSET "test:hash" "field1" "value1" "field2" "value2"
HGETALL "test:hash"

# Test 4: List operations
LPUSH "test:list" "item1" "item2" "item3"
LRANGE "test:list" 0 -1

# Test 5: Set operations
SADD "test:set" "member1" "member2" "member3"
SMEMBERS "test:set"

# Test 6: Sorted set operations
ZADD "test:zset" 1 "first" 2 "second" 3 "third"
ZRANGE "test:zset" 0 -1 WITHSCORES

# Test 7: Key expiration
SET "test:expire" "will_expire" EX 5
TTL "test:expire"

# Clean up test keys
DEL "test:string" "test:hash" "test:list" "test:set" "test:zset" "test:expire"

ECHO "=== Tests Completed ==="
EOF
}

# Function to show Redis statistics
show_redis_stats() {
    print_header "REDIS DATABASE STATISTICS"
    
    print_status "Redis server information:"
    docker exec rbi-redis redis-cli INFO server | grep -E "(redis_version|os|arch|process_id|uptime_in_seconds)"
    
    print_status "Memory usage:"
    docker exec rbi-redis redis-cli INFO memory | grep -E "(used_memory_human|used_memory_peak_human|maxmemory_human)"
    
    print_status "Key statistics:"
    docker exec rbi-redis redis-cli INFO keyspace
    
    print_status "Connected clients:"
    docker exec rbi-redis redis-cli INFO clients | grep -E "(connected_clients|client_recent_max_input_buffer)"
    
    print_status "Sample keys by namespace:"
    docker exec rbi-redis redis-cli KEYS "session:*" | head -5
    docker exec rbi-redis redis-cli KEYS "cache:*" | head -5
    docker exec rbi-redis redis-cli KEYS "workflow:*" | head -5
    docker exec rbi-redis redis-cli KEYS "compliance:*" | head -5
}

# Function to create Redis backup
create_backup() {
    print_status "Creating Redis backup..."
    
    # Trigger a background save
    execute_redis_command "BGSAVE" "Creating background save"
    
    # Wait a moment for the save to complete
    sleep 2
    
    # Check last save time
    print_status "Last save time:"
    docker exec rbi-redis redis-cli LASTSAVE
    
    print_success "Backup initiated successfully"
}

# Main execution
main() {
    print_header "REDIS CACHE SETUP"
    
    # Check if Redis is running
    if ! check_redis; then
        exit 1
    fi
    
    # Setup Redis configuration
    setup_redis_config
    
    # Setup data structures
    setup_data_structures
    
    # Setup monitoring
    setup_monitoring
    
    # Run tests
    run_redis_tests
    
    # Show statistics
    show_redis_stats
    
    # Create backup
    create_backup
    
    print_header "REDIS SETUP COMPLETE"
    print_success "Redis is ready for use!"
    
    print_status "Connection details:"
    echo "  Host: $REDIS_HOST"
    echo "  Port: $REDIS_PORT"
    echo ""
    print_status "You can connect using:"
    echo "  docker exec -it rbi-redis redis-cli"
    echo "  or use Redis Commander at: http://localhost:8082"
    echo ""
    print_status "Key namespaces configured:"
    echo "  session:*     - User sessions (24h TTL)"
    echo "  cache:*       - Application cache (1h TTL)"
    echo "  realtime:*    - Real-time data (5m TTL)"
    echo "  workflow:*    - Workflow states (7d TTL)"
    echo "  metrics:*     - Compliance metrics (1d TTL)"
    echo "  risk:*        - Risk calculations (4h TTL)"
    echo "  queue:*       - Processing queues"
    echo "  alerts:*      - Real-time alerts"
}

# Run main function
main "$@"
