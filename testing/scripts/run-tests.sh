#!/bin/bash

# RBI Compliance Platform - Test Automation Script
# Comprehensive test execution with reporting and notifications

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_TYPE="all"
ENVIRONMENT="test"
COVERAGE_THRESHOLD=80
PARALLEL_WORKERS=4
TIMEOUT=300000
VERBOSE=false
CI_MODE=false
NOTIFICATION_WEBHOOK=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Show usage
show_usage() {
    cat << EOF
RBI Compliance Platform - Test Automation Script

Usage: $0 [OPTIONS]

Options:
    -t, --type TYPE         Test type (unit|integration|e2e|performance|security|all) [default: all]
    -e, --environment ENV   Environment (test|staging|prod) [default: test]
    -c, --coverage NUM      Coverage threshold percentage [default: 80]
    -w, --workers NUM       Number of parallel workers [default: 4]
    -T, --timeout NUM       Test timeout in milliseconds [default: 300000]
    -v, --verbose          Enable verbose output
    -C, --ci               CI mode (non-interactive)
    -n, --notify URL       Webhook URL for notifications
    -h, --help             Show this help message

Examples:
    $0 -t unit -v                    # Run unit tests with verbose output
    $0 -t all -c 85 -w 2            # Run all tests with 85% coverage, 2 workers
    $0 -t e2e -e staging -C          # Run E2E tests in staging with CI mode
    $0 -t performance -n webhook-url # Run performance tests with notifications

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                TEST_TYPE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -c|--coverage)
                COVERAGE_THRESHOLD="$2"
                shift 2
                ;;
            -w|--workers)
                PARALLEL_WORKERS="$2"
                shift 2
                ;;
            -T|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -C|--ci)
                CI_MODE=true
                shift
                ;;
            -n|--notify)
                NOTIFICATION_WEBHOOK="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate test type
    if [[ "$TEST_TYPE" != "unit" && "$TEST_TYPE" != "integration" && "$TEST_TYPE" != "e2e" &&
          "$TEST_TYPE" != "performance" && "$TEST_TYPE" != "security" && "$TEST_TYPE" != "all" ]]; then
        log_error "Invalid test type: $TEST_TYPE"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'v' -f2)
    if [[ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" != "18.0.0" ]]; then
        log_error "Node.js version 18.0.0 or higher is required. Current: $NODE_VERSION"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    # Check Docker for integration tests
    if [[ "$TEST_TYPE" == "integration" || "$TEST_TYPE" == "all" ]]; then
        if ! command -v docker &> /dev/null; then
            log_warning "Docker is not installed. Integration tests may fail."
        fi
    fi

    # Check Chrome for E2E tests
    if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
        if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null; then
            log_warning "Chrome/Chromium is not installed. E2E tests may fail."
        fi
    fi

    log_success "Prerequisites check completed"
}

# Setup test environment
setup_environment() {
    log_step "Setting up test environment..."

    cd "$PROJECT_ROOT"

    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi

    # Set environment variables
    export NODE_ENV="$ENVIRONMENT"
    export TEST_TIMEOUT="$TIMEOUT"
    export JEST_WORKERS="$PARALLEL_WORKERS"

    if [[ "$CI_MODE" == "true" ]]; then
        export CI=true
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        export TEST_VERBOSE=true
    fi

    # Create test directories
    mkdir -p reports coverage logs

    log_success "Test environment setup completed"
}

# Start required services
start_services() {
    log_step "Starting required services..."

    # Start test database
    if [[ "$TEST_TYPE" == "integration" || "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
        log_info "Starting test database..."
        docker-compose -f docker-compose.test.yml up -d mongodb redis

        # Wait for services to be ready
        log_info "Waiting for services to be ready..."
        sleep 10
    fi

    # Start application server for E2E tests
    if [[ "$TEST_TYPE" == "e2e" || "$TEST_TYPE" == "all" ]]; then
        log_info "Starting application server..."
        npm run start:test &
        APP_PID=$!

        # Wait for server to be ready
        log_info "Waiting for application server..."
        npx wait-on http://localhost:3000 --timeout 60000
    fi

    log_success "Services started successfully"
}

# Run specific test type
run_tests() {
    local test_type=$1
    log_step "Running $test_type tests..."

    local jest_args=""
    local coverage_args=""

    # Configure Jest arguments
    if [[ "$CI_MODE" == "true" ]]; then
        jest_args="--ci --watchAll=false"
    fi

    if [[ "$VERBOSE" == "true" ]]; then
        jest_args="$jest_args --verbose"
    fi

    jest_args="$jest_args --maxWorkers=$PARALLEL_WORKERS --testTimeout=$TIMEOUT"

    # Configure coverage
    if [[ "$test_type" != "performance" && "$test_type" != "e2e" ]]; then
        coverage_args="--coverage --coverageThreshold='{\"global\":{\"branches\":$COVERAGE_THRESHOLD,\"functions\":$COVERAGE_THRESHOLD,\"lines\":$COVERAGE_THRESHOLD,\"statements\":$COVERAGE_THRESHOLD}}'"
    fi

    # Run tests based on type
    case $test_type in
        unit)
            npm run test:unit -- $jest_args $coverage_args
            ;;
        integration)
            npm run test:integration -- $jest_args $coverage_args
            ;;
        e2e)
            npm run test:e2e -- $jest_args
            ;;
        performance)
            npm run test:performance -- $jest_args
            ;;
        security)
            npm run test:security -- $jest_args $coverage_args
            ;;
        all)
            npm run test:unit -- $jest_args $coverage_args
            npm run test:integration -- $jest_args $coverage_args
            npm run test:e2e -- $jest_args
            npm run test:performance -- $jest_args
            npm run test:security -- $jest_args $coverage_args
            ;;
    esac

    log_success "$test_type tests completed"
}

# Generate test reports
generate_reports() {
    log_step "Generating test reports..."

    # Generate coverage reports
    if [[ -d "coverage" ]]; then
        log_info "Generating coverage reports..."
        npm run test:report:html
        npm run test:report:lcov
        npm run test:report:cobertura
    fi

    # Generate test results summary
    cat > reports/test-summary.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "testType": "$TEST_TYPE",
  "coverageThreshold": $COVERAGE_THRESHOLD,
  "parallelWorkers": $PARALLEL_WORKERS,
  "timeout": $TIMEOUT,
  "ciMode": $CI_MODE,
  "verbose": $VERBOSE
}
EOF

    log_success "Test reports generated"
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2

    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        log_step "Sending notifications..."

        local color="good"
        if [[ "$status" != "success" ]]; then
            color="danger"
        fi

        local payload=$(cat << EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "RBI Compliance Platform - Test Results",
      "fields": [
        {
          "title": "Status",
          "value": "$status",
          "short": true
        },
        {
          "title": "Test Type",
          "value": "$TEST_TYPE",
          "short": true
        },
        {
          "title": "Environment",
          "value": "$ENVIRONMENT",
          "short": true
        },
        {
          "title": "Coverage Threshold",
          "value": "$COVERAGE_THRESHOLD%",
          "short": true
        }
      ],
      "text": "$message",
      "ts": $(date +%s)
    }
  ]
}
EOF
        )

        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$NOTIFICATION_WEBHOOK" || true

        log_success "Notification sent"
    fi
}

# Cleanup function
cleanup() {
    log_step "Cleaning up..."

    # Stop application server
    if [[ -n "${APP_PID:-}" ]]; then
        kill $APP_PID 2>/dev/null || true
    fi

    # Stop test services
    docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

    # Clean up temporary files
    rm -f .test-*.tmp

    log_success "Cleanup completed"
}

# Main execution function
main() {
    local start_time=$(date +%s)
    local status="success"
    local message="All tests passed successfully"

    # Set up trap for cleanup
    trap cleanup EXIT

    log_info "Starting RBI Compliance Platform test execution..."
    log_info "Test Type: $TEST_TYPE"
    log_info "Environment: $ENVIRONMENT"
    log_info "Coverage Threshold: $COVERAGE_THRESHOLD%"
    log_info "Parallel Workers: $PARALLEL_WORKERS"
    log_info "Timeout: ${TIMEOUT}ms"
    log_info "CI Mode: $CI_MODE"
    log_info "Verbose: $VERBOSE"

    # Execute test pipeline
    check_prerequisites
    setup_environment
    start_services

    # Run tests with error handling
    if ! run_tests "$TEST_TYPE"; then
        status="failure"
        message="Some tests failed. Check the logs for details."
        log_error "$message"
    fi

    generate_reports

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))

    log_info "Test execution completed in $duration_formatted"

    # Send notifications
    send_notifications "$status" "$message (Duration: $duration_formatted)"

    if [[ "$status" == "failure" ]]; then
        exit 1
    fi

    log_success "All tests completed successfully!"
}

# Parse arguments and run main function
parse_args "$@"
main
