#!/bin/bash

# =============================================================================
# RabbitMQ Setup Script for RBI Compliance Platform
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

# RabbitMQ container name
RABBITMQ_CONTAINER="rbi-rabbitmq"

# Function to execute RabbitMQ admin commands
rabbitmq_exec() {
    docker exec "$RABBITMQ_CONTAINER" rabbitmqctl "$@"
}

# Function to create exchange
create_exchange() {
    local exchange_name=$1
    local exchange_type=${2:-"topic"}
    
    print_status "Creating exchange: $exchange_name (type: $exchange_type)"
    rabbitmq_exec eval "rabbit_exchange:declare({resource, <<\"/\">>, exchange, <<\"$exchange_name\">>}, $exchange_type, true, false, false, [])."
    print_success "Exchange $exchange_name created successfully"
}

# Function to create queue
create_queue() {
    local queue_name=$1
    local durable=${2:-true}
    
    print_status "Creating queue: $queue_name (durable: $durable)"
    rabbitmq_exec eval "rabbit_amqqueue:declare({resource, <<\"/\">>, queue, <<\"$queue_name\">>}, $durable, false, [], none, <<\"guest\">>)."
    print_success "Queue $queue_name created successfully"
}

print_status "Setting up RabbitMQ for RBI Compliance Platform..."

# Wait for RabbitMQ to be ready
print_status "Waiting for RabbitMQ to be ready..."
sleep 10

# =============================================================================
# EXCHANGES
# =============================================================================

print_status "Creating exchanges..."

# Topic exchanges for event routing
create_exchange "compliance.events" "topic"
create_exchange "regulatory.events" "topic"
create_exchange "document.events" "topic"
create_exchange "risk.events" "topic"
create_exchange "integration.events" "topic"
create_exchange "audit.events" "topic"

# Direct exchanges for specific routing
create_exchange "notifications.direct" "direct"
create_exchange "tasks.direct" "direct"

# =============================================================================
# QUEUES
# =============================================================================

print_status "Creating queues..."

# Compliance workflow queues
create_queue "compliance.workflow.processing"
create_queue "compliance.task.assignment"
create_queue "compliance.approval.pending"
create_queue "compliance.deadline.monitoring"

# Regulatory intelligence queues
create_queue "regulatory.circular.scraping"
create_queue "regulatory.parsing.nlp"
create_queue "regulatory.impact.analysis"
create_queue "regulatory.change.notification"

# Document processing queues
create_queue "document.upload.processing"
create_queue "document.ocr.processing"
create_queue "document.classification"
create_queue "document.signature.workflow"

# Risk assessment queues
create_queue "risk.scoring.calculation"
create_queue "risk.prediction.modeling"
create_queue "risk.scenario.analysis"
create_queue "risk.alert.generation"

# Integration queues
create_queue "integration.bank.data.sync"
create_queue "integration.external.api.calls"
create_queue "integration.data.transformation"
create_queue "integration.error.handling"

# Notification queues
create_queue "notifications.email"
create_queue "notifications.sms"
create_queue "notifications.push"
create_queue "notifications.dashboard"

# Audit and monitoring queues
create_queue "audit.log.processing"
create_queue "security.event.analysis"
create_queue "system.health.monitoring"
create_queue "performance.metrics.collection"

# Dead letter queues
create_queue "compliance.dlq"
create_queue "regulatory.dlq"
create_queue "document.dlq"
create_queue "risk.dlq"
create_queue "integration.dlq"

print_status "Setting up queue bindings..."

# Note: Queue bindings would typically be set up in the application code
# or through the management interface, but here's an example of how to do it via CLI

print_success "RabbitMQ setup completed successfully!"
print_status "RabbitMQ Management UI available at: http://localhost:15672"
print_status "Default credentials: guest/guest"

print_status "Created exchanges:"
rabbitmq_exec list_exchanges

print_status "Created queues:"
rabbitmq_exec list_queues
