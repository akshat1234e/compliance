#!/bin/bash

# =============================================================================
# Kong API Gateway Setup Script for RBI Compliance Platform
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"

# Function to make Kong Admin API calls
kong_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" "$KONG_ADMIN_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data"
    else
        curl -s -X "$method" "$KONG_ADMIN_URL$endpoint"
    fi
}

# Function to wait for Kong to be ready
wait_for_kong() {
    print_status "Waiting for Kong to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if kong_api "GET" "/" > /dev/null 2>&1; then
            print_success "Kong is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - Kong not ready yet, waiting..."
        sleep 5
        ((attempt++))
    done
    
    print_warning "Kong did not become ready within expected time"
    return 1
}

# Function to create a service
create_service() {
    local name=$1
    local url=$2
    local path=${3:-"/"}
    
    print_status "Creating service: $name"
    
    local service_data="{
        \"name\": \"$name\",
        \"url\": \"$url\",
        \"path\": \"$path\"
    }"
    
    kong_api "POST" "/services" "$service_data"
    print_success "Service $name created successfully"
}

# Function to create a route
create_route() {
    local service_name=$1
    local path=$2
    local methods=${3:-"[\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\"]"}
    
    print_status "Creating route for service: $service_name"
    
    local route_data="{
        \"paths\": [\"$path\"],
        \"methods\": $methods,
        \"strip_path\": true
    }"
    
    kong_api "POST" "/services/$service_name/routes" "$route_data"
    print_success "Route created for service $service_name"
}

# Function to add rate limiting plugin
add_rate_limiting() {
    local service_name=$1
    local minute_limit=${2:-100}
    local hour_limit=${3:-1000}
    
    print_status "Adding rate limiting to service: $service_name"
    
    local plugin_data="{
        \"name\": \"rate-limiting\",
        \"config\": {
            \"minute\": $minute_limit,
            \"hour\": $hour_limit,
            \"policy\": \"local\"
        }
    }"
    
    kong_api "POST" "/services/$service_name/plugins" "$plugin_data"
    print_success "Rate limiting added to service $service_name"
}

# Function to add CORS plugin
add_cors() {
    local service_name=$1
    
    print_status "Adding CORS to service: $service_name"
    
    local plugin_data="{
        \"name\": \"cors\",
        \"config\": {
            \"origins\": [\"http://localhost:3000\", \"http://localhost:3001\"],
            \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\", \"OPTIONS\"],
            \"headers\": [\"Accept\", \"Accept-Version\", \"Content-Length\", \"Content-MD5\", \"Content-Type\", \"Date\", \"Authorization\"],
            \"exposed_headers\": [\"X-Auth-Token\"],
            \"credentials\": true,
            \"max_age\": 3600
        }
    }"
    
    kong_api "POST" "/services/$service_name/plugins" "$plugin_data"
    print_success "CORS added to service $service_name"
}

# Function to add JWT authentication
add_jwt_auth() {
    local service_name=$1
    
    print_status "Adding JWT authentication to service: $service_name"
    
    local plugin_data="{
        \"name\": \"jwt\",
        \"config\": {
            \"uri_param_names\": [\"token\"],
            \"header_names\": [\"Authorization\"],
            \"claims_to_verify\": [\"exp\"]
        }
    }"
    
    kong_api "POST" "/services/$service_name/plugins" "$plugin_data"
    print_success "JWT authentication added to service $service_name"
}

print_status "Setting up Kong API Gateway for RBI Compliance Platform..."

# Wait for Kong to be ready
wait_for_kong

print_status "Creating services and routes..."

# =============================================================================
# REGULATORY INTELLIGENCE SERVICE
# =============================================================================

create_service "regulatory-intelligence" "http://host.docker.internal:3001" "/api/v1"
create_route "regulatory-intelligence" "/api/v1/regulations"
add_rate_limiting "regulatory-intelligence" 200 2000
add_cors "regulatory-intelligence"

# =============================================================================
# COMPLIANCE ORCHESTRATION SERVICE
# =============================================================================

create_service "compliance-orchestration" "http://host.docker.internal:3002" "/api/v1"
create_route "compliance-orchestration" "/api/v1/workflows"
add_rate_limiting "compliance-orchestration" 150 1500
add_cors "compliance-orchestration"
add_jwt_auth "compliance-orchestration"

# =============================================================================
# DOCUMENT MANAGEMENT SERVICE
# =============================================================================

create_service "document-management" "http://host.docker.internal:3003" "/api/v1"
create_route "document-management" "/api/v1/documents"
add_rate_limiting "document-management" 100 1000
add_cors "document-management"
add_jwt_auth "document-management"

# =============================================================================
# REPORTING & ANALYTICS SERVICE
# =============================================================================

create_service "reporting-analytics" "http://host.docker.internal:3004" "/api/v1"
create_route "reporting-analytics" "/api/v1/reports"
add_rate_limiting "reporting-analytics" 50 500
add_cors "reporting-analytics"
add_jwt_auth "reporting-analytics"

# =============================================================================
# RISK ASSESSMENT SERVICE
# =============================================================================

create_service "risk-assessment" "http://host.docker.internal:3005" "/api/v1"
create_route "risk-assessment" "/api/v1/risk"
add_rate_limiting "risk-assessment" 100 1000
add_cors "risk-assessment"
add_jwt_auth "risk-assessment"

# =============================================================================
# INTEGRATION GATEWAY SERVICE
# =============================================================================

create_service "integration-gateway" "http://host.docker.internal:3006" "/api/v1"
create_route "integration-gateway" "/api/v1/integrations"
add_rate_limiting "integration-gateway" 200 2000
add_cors "integration-gateway"
add_jwt_auth "integration-gateway"

print_success "Kong API Gateway setup completed successfully!"

print_status "Kong configuration summary:"
echo "  - Admin API: http://localhost:8001"
echo "  - Proxy: http://localhost:8000"
echo "  - Services configured with rate limiting and CORS"
echo "  - JWT authentication enabled for protected services"

print_status "Available API endpoints through Kong:"
echo "  - Regulatory Intelligence: http://localhost:8000/api/v1/regulations"
echo "  - Compliance Orchestration: http://localhost:8000/api/v1/workflows"
echo "  - Document Management: http://localhost:8000/api/v1/documents"
echo "  - Reporting & Analytics: http://localhost:8000/api/v1/reports"
echo "  - Risk Assessment: http://localhost:8000/api/v1/risk"
echo "  - Integration Gateway: http://localhost:8000/api/v1/integrations"

print_status "To view Kong configuration:"
echo "  curl http://localhost:8001/services"
echo "  curl http://localhost:8001/routes"
