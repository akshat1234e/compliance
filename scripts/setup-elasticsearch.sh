#!/bin/bash

# =============================================================================
# Elasticsearch Setup Script
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

# Elasticsearch connection parameters
ES_HOST=${ES_HOST:-localhost}
ES_PORT=${ES_PORT:-9200}
ES_URL="http://${ES_HOST}:${ES_PORT}"

# Function to check if Elasticsearch is running
check_elasticsearch() {
    print_status "Checking Elasticsearch connection..."
    
    if curl -s "$ES_URL/_cluster/health" > /dev/null 2>&1; then
        print_success "Elasticsearch is running and accessible"
        return 0
    else
        print_error "Elasticsearch is not accessible. Please ensure Docker containers are running."
        print_status "Try running: ./scripts/docker-dev.sh start"
        return 1
    fi
}

# Function to execute Elasticsearch API call
execute_es_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    print_status "Executing: $description"
    
    local curl_cmd="curl -s -X $method $ES_URL$endpoint"
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if eval $curl_cmd > /dev/null 2>&1; then
        print_success "Successfully executed: $description"
        return 0
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to create index templates
create_index_templates() {
    print_header "CREATING ELASTICSEARCH INDEX TEMPLATES"
    
    # Documents index template
    local documents_template='{
        "index_patterns": ["documents-*"],
        "template": {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "compliance_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "snowball"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "title": {
                        "type": "text",
                        "analyzer": "compliance_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "compliance_analyzer"
                    },
                    "description": {
                        "type": "text",
                        "analyzer": "compliance_analyzer"
                    },
                    "organizationId": {"type": "keyword"},
                    "categoryId": {"type": "keyword"},
                    "documentType": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "createdAt": {"type": "date"},
                    "updatedAt": {"type": "date"},
                    "fileInfo": {
                        "properties": {
                            "originalFilename": {"type": "keyword"},
                            "fileSize": {"type": "long"},
                            "mimeType": {"type": "keyword"}
                        }
                    }
                }
            }
        }
    }'
    
    execute_es_api "PUT" "/_index_template/documents_template" "$documents_template" "Creating documents index template"
    
    # RBI Circulars index template
    local circulars_template='{
        "index_patterns": ["rbi-circulars-*"],
        "template": {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "regulatory_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "snowball"]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "circularNumber": {"type": "keyword"},
                    "title": {
                        "type": "text",
                        "analyzer": "regulatory_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "regulatory_analyzer"
                    },
                    "summary": {
                        "type": "text",
                        "analyzer": "regulatory_analyzer"
                    },
                    "circularDate": {"type": "date"},
                    "effectiveDate": {"type": "date"},
                    "category": {"type": "keyword"},
                    "subCategory": {"type": "keyword"},
                    "impactLevel": {"type": "keyword"},
                    "affectedEntities": {"type": "keyword"},
                    "subjectTags": {"type": "keyword"},
                    "processingStatus": {"type": "keyword"},
                    "keyPoints": {"type": "text"}
                }
            }
        }
    }'
    
    execute_es_api "PUT" "/_index_template/rbi_circulars_template" "$circulars_template" "Creating RBI circulars index template"
    
    # Compliance requirements index template
    local requirements_template='{
        "index_patterns": ["compliance-requirements-*"],
        "template": {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0
            },
            "mappings": {
                "properties": {
                    "requirementCode": {"type": "keyword"},
                    "title": {
                        "type": "text",
                        "analyzer": "compliance_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "description": {
                        "type": "text",
                        "analyzer": "compliance_analyzer"
                    },
                    "category": {"type": "keyword"},
                    "subCategory": {"type": "keyword"},
                    "priority": {"type": "keyword"},
                    "frequency": {"type": "keyword"},
                    "applicableEntities": {"type": "keyword"},
                    "regulationId": {"type": "keyword"},
                    "status": {"type": "keyword"}
                }
            }
        }
    }'
    
    execute_es_api "PUT" "/_index_template/compliance_requirements_template" "$requirements_template" "Creating compliance requirements index template"
}

# Function to create indices
create_indices() {
    print_header "CREATING ELASTICSEARCH INDICES"
    
    # Create documents index
    execute_es_api "PUT" "/documents-2024" "" "Creating documents index"
    
    # Create RBI circulars index
    execute_es_api "PUT" "/rbi-circulars-2024" "" "Creating RBI circulars index"
    
    # Create compliance requirements index
    execute_es_api "PUT" "/compliance-requirements-2024" "" "Creating compliance requirements index"
    
    # Create audit logs index
    execute_es_api "PUT" "/audit-logs-2024" "" "Creating audit logs index"
    
    # Create risk assessments index
    execute_es_api "PUT" "/risk-assessments-2024" "" "Creating risk assessments index"
}

# Function to create sample data
create_sample_data() {
    print_status "Creating sample data..."
    
    # Sample RBI circular
    local sample_circular='{
        "circularNumber": "RBI/2024/001",
        "title": "Guidelines on Capital Adequacy Framework",
        "content": "This circular provides updated guidelines on capital adequacy framework for banks and NBFCs. The new framework emphasizes risk-based capital allocation and enhanced monitoring mechanisms.",
        "summary": "Updated capital adequacy guidelines with enhanced risk-based framework",
        "circularDate": "2024-01-15",
        "effectiveDate": "2024-04-01",
        "category": "Capital Adequacy",
        "subCategory": "Risk Management",
        "impactLevel": "high",
        "affectedEntities": ["banks", "nbfcs"],
        "subjectTags": ["capital", "adequacy", "risk", "framework"],
        "processingStatus": "analyzed",
        "keyPoints": ["Enhanced risk-based capital allocation", "Improved monitoring mechanisms", "Quarterly reporting requirements"]
    }'
    
    execute_es_api "POST" "/rbi-circulars-2024/_doc" "$sample_circular" "Creating sample RBI circular"
    
    # Sample document
    local sample_document='{
        "title": "Compliance Policy Manual",
        "content": "This manual outlines the comprehensive compliance policies and procedures for the organization. It covers regulatory requirements, internal controls, and monitoring mechanisms.",
        "description": "Comprehensive compliance policy manual covering all regulatory requirements",
        "organizationId": "org-demo-bank",
        "categoryId": "policies",
        "documentType": "policy",
        "tags": ["compliance", "policy", "manual", "procedures"],
        "status": "published",
        "createdAt": "2024-01-10T10:00:00Z",
        "updatedAt": "2024-01-10T10:00:00Z",
        "fileInfo": {
            "originalFilename": "compliance-policy-manual.pdf",
            "fileSize": 2048000,
            "mimeType": "application/pdf"
        }
    }'
    
    execute_es_api "POST" "/documents-2024/_doc" "$sample_document" "Creating sample document"
    
    # Sample compliance requirement
    local sample_requirement='{
        "requirementCode": "CAP-001",
        "title": "Minimum Capital Adequacy Ratio",
        "description": "Banks must maintain a minimum capital adequacy ratio of 9% as per Basel III norms",
        "category": "Capital Adequacy",
        "subCategory": "Minimum Requirements",
        "priority": "high",
        "frequency": "quarterly",
        "applicableEntities": ["banks", "nbfcs"],
        "regulationId": "reg-basel-iii",
        "status": "active"
    }'
    
    execute_es_api "POST" "/compliance-requirements-2024/_doc" "$sample_requirement" "Creating sample compliance requirement"
}

# Function to run Elasticsearch tests
run_elasticsearch_tests() {
    print_status "Running Elasticsearch tests..."
    
    print_status "Test results:"
    
    # Test 1: Cluster health
    print_status "1. Cluster health test:"
    curl -s "$ES_URL/_cluster/health?pretty" | grep -E "(status|number_of_nodes)"
    
    # Test 2: Index listing
    print_status "2. Index listing test:"
    curl -s "$ES_URL/_cat/indices?v" | head -10
    
    # Test 3: Search test
    print_status "3. Search test (searching for 'capital'):"
    curl -s "$ES_URL/_search?q=capital&pretty" | grep -E "(took|hits)"
    
    # Test 4: Aggregation test
    print_status "4. Aggregation test (document types):"
    local agg_query='{
        "size": 0,
        "aggs": {
            "document_types": {
                "terms": {
                    "field": "documentType"
                }
            }
        }
    }'
    curl -s -X POST "$ES_URL/documents-2024/_search" -H "Content-Type: application/json" -d "$agg_query" | grep -A 10 "aggregations"
}

# Function to show Elasticsearch statistics
show_elasticsearch_stats() {
    print_header "ELASTICSEARCH STATISTICS"
    
    print_status "Cluster information:"
    curl -s "$ES_URL/_cluster/stats?pretty" | grep -E "(cluster_name|status|nodes|indices)"
    
    print_status "Node information:"
    curl -s "$ES_URL/_nodes/stats?pretty" | grep -E "(name|host|version)"
    
    print_status "Index statistics:"
    curl -s "$ES_URL/_cat/indices?v&s=index"
    
    print_status "Index templates:"
    curl -s "$ES_URL/_cat/templates?v"
}

# Function to setup index aliases
setup_aliases() {
    print_status "Setting up index aliases..."
    
    local aliases_config='{
        "actions": [
            {"add": {"index": "documents-2024", "alias": "documents"}},
            {"add": {"index": "rbi-circulars-2024", "alias": "rbi-circulars"}},
            {"add": {"index": "compliance-requirements-2024", "alias": "compliance-requirements"}},
            {"add": {"index": "audit-logs-2024", "alias": "audit-logs"}},
            {"add": {"index": "risk-assessments-2024", "alias": "risk-assessments"}}
        ]
    }'
    
    execute_es_api "POST" "/_aliases" "$aliases_config" "Setting up index aliases"
}

# Main execution
main() {
    print_header "ELASTICSEARCH SETUP"
    
    # Check if Elasticsearch is running
    if ! check_elasticsearch; then
        exit 1
    fi
    
    # Wait for Elasticsearch to be fully ready
    print_status "Waiting for Elasticsearch to be ready..."
    sleep 10
    
    # Create index templates
    create_index_templates
    
    # Create indices
    create_indices
    
    # Setup aliases
    setup_aliases
    
    # Create sample data
    create_sample_data
    
    # Wait for indexing to complete
    sleep 5
    
    # Run tests
    run_elasticsearch_tests
    
    # Show statistics
    show_elasticsearch_stats
    
    print_header "ELASTICSEARCH SETUP COMPLETE"
    print_success "Elasticsearch is ready for use!"
    
    print_status "Connection details:"
    echo "  Host: $ES_HOST"
    echo "  Port: $ES_PORT"
    echo "  URL: $ES_URL"
    echo ""
    print_status "Available indices:"
    echo "  documents (documents-2024)"
    echo "  rbi-circulars (rbi-circulars-2024)"
    echo "  compliance-requirements (compliance-requirements-2024)"
    echo "  audit-logs (audit-logs-2024)"
    echo "  risk-assessments (risk-assessments-2024)"
    echo ""
    print_status "You can access Elasticsearch using:"
    echo "  curl $ES_URL/_cluster/health"
    echo "  or use Kibana at: http://localhost:5601"
}

# Run main function
main "$@"
