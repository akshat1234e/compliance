#!/bin/bash

# =============================================================================
# Kafka Topics Setup Script for RBI Compliance Platform
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Kafka broker address
KAFKA_BROKER="localhost:9092"

# Function to create a topic
create_topic() {
    local topic_name=$1
    local partitions=${2:-3}
    local replication_factor=${3:-1}
    
    print_status "Creating topic: $topic_name (partitions: $partitions, replication: $replication_factor)"
    
    docker exec rbi-kafka kafka-topics \
        --create \
        --topic "$topic_name" \
        --partitions "$partitions" \
        --replication-factor "$replication_factor" \
        --bootstrap-server "$KAFKA_BROKER" \
        --if-not-exists
    
    print_success "Topic $topic_name created successfully"
}

print_status "Setting up Kafka topics for RBI Compliance Platform..."

# =============================================================================
# REGULATORY INTELLIGENCE TOPICS
# =============================================================================

create_topic "regulatory.circular.scraped" 3 1
create_topic "regulatory.circular.parsed" 3 1
create_topic "regulatory.impact.assessed" 3 1
create_topic "regulatory.change.detected" 3 1
create_topic "regulatory.notification.sent" 3 1

# =============================================================================
# COMPLIANCE ORCHESTRATION TOPICS
# =============================================================================

create_topic "compliance.workflow.created" 3 1
create_topic "compliance.workflow.updated" 3 1
create_topic "compliance.task.assigned" 3 1
create_topic "compliance.task.completed" 3 1
create_topic "compliance.approval.requested" 3 1
create_topic "compliance.approval.completed" 3 1

# =============================================================================
# DOCUMENT MANAGEMENT TOPICS
# =============================================================================

create_topic "document.uploaded" 3 1
create_topic "document.processed" 3 1
create_topic "document.classified" 3 1
create_topic "document.version.created" 3 1
create_topic "document.signature.requested" 3 1
create_topic "document.signature.completed" 3 1

# =============================================================================
# RISK ASSESSMENT TOPICS
# =============================================================================

create_topic "risk.assessment.triggered" 3 1
create_topic "risk.score.calculated" 3 1
create_topic "risk.prediction.generated" 3 1
create_topic "risk.scenario.analyzed" 3 1
create_topic "risk.alert.generated" 3 1

# =============================================================================
# REPORTING & ANALYTICS TOPICS
# =============================================================================

create_topic "report.generation.requested" 3 1
create_topic "report.generation.completed" 3 1
create_topic "analytics.data.aggregated" 3 1
create_topic "dashboard.data.updated" 3 1

# =============================================================================
# INTEGRATION TOPICS
# =============================================================================

create_topic "integration.bank.data.received" 3 1
create_topic "integration.bank.data.transformed" 3 1
create_topic "integration.external.api.called" 3 1
create_topic "integration.error.occurred" 3 1

# =============================================================================
# AUDIT & MONITORING TOPICS
# =============================================================================

create_topic "audit.event.logged" 3 1
create_topic "security.event.detected" 3 1
create_topic "system.health.checked" 3 1
create_topic "performance.metrics.collected" 3 1

print_status "Listing all created topics..."
docker exec rbi-kafka kafka-topics --list --bootstrap-server "$KAFKA_BROKER"

print_success "All Kafka topics created successfully!"
print_status "You can view topic details using:"
echo "  docker exec rbi-kafka kafka-topics --describe --bootstrap-server $KAFKA_BROKER"
