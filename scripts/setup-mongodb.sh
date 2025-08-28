#!/bin/bash

# =============================================================================
# MongoDB Database Setup Script
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

# MongoDB connection parameters
MONGO_HOST=${MONGO_HOST:-localhost}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_DB=${MONGO_DB:-rbi_compliance_docs_dev}
MONGO_USER=${MONGO_USER:-root}
MONGO_PASSWORD=${MONGO_PASSWORD:-mongodb}

# Function to check if MongoDB is running
check_mongodb() {
    print_status "Checking MongoDB connection..."
    
    if docker exec rbi-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is running and accessible"
        return 0
    else
        print_error "MongoDB is not accessible. Please ensure Docker containers are running."
        print_status "Try running: ./scripts/docker-dev.sh start"
        return 1
    fi
}

# Function to execute MongoDB script
execute_mongo_script() {
    local script_content=$1
    local description=$2
    
    print_status "Executing: $description"
    
    if docker exec rbi-mongodb mongosh "$MONGO_DB" --eval "$script_content" > /dev/null 2>&1; then
        print_success "Successfully executed: $description"
        return 0
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to create collections and indexes
setup_collections() {
    print_header "SETTING UP MONGODB COLLECTIONS"
    
    # Document Storage Collections
    print_status "Creating document storage collections..."
    
    local collections_script='
    // Create collections for document storage
    db.createCollection("documents", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["title", "organizationId", "categoryId", "fileInfo"],
                properties: {
                    title: { bsonType: "string" },
                    organizationId: { bsonType: "string" },
                    categoryId: { bsonType: "string" },
                    fileInfo: {
                        bsonType: "object",
                        required: ["originalFilename", "fileSize", "mimeType"],
                        properties: {
                            originalFilename: { bsonType: "string" },
                            fileSize: { bsonType: "number" },
                            mimeType: { bsonType: "string" }
                        }
                    }
                }
            }
        }
    });
    
    db.createCollection("documentVersions", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["documentId", "versionNumber", "fileInfo"],
                properties: {
                    documentId: { bsonType: "string" },
                    versionNumber: { bsonType: "string" },
                    fileInfo: { bsonType: "object" }
                }
            }
        }
    });
    
    db.createCollection("rbiCirculars", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["circularNumber", "title", "circularDate"],
                properties: {
                    circularNumber: { bsonType: "string" },
                    title: { bsonType: "string" },
                    circularDate: { bsonType: "date" }
                }
            }
        }
    });
    
    db.createCollection("workflowData", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["workflowInstanceId", "organizationId"],
                properties: {
                    workflowInstanceId: { bsonType: "string" },
                    organizationId: { bsonType: "string" }
                }
            }
        }
    });
    
    db.createCollection("riskAnalytics", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["organizationId", "analysisType"],
                properties: {
                    organizationId: { bsonType: "string" },
                    analysisType: { bsonType: "string" }
                }
            }
        }
    });
    
    db.createCollection("complianceEvidence", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["organizationId", "requirementId", "evidenceType"],
                properties: {
                    organizationId: { bsonType: "string" },
                    requirementId: { bsonType: "string" },
                    evidenceType: { bsonType: "string" }
                }
            }
        }
    });
    
    print("Collections created successfully");
    '
    
    execute_mongo_script "$collections_script" "Creating collections with validation"
}

# Function to create indexes
create_indexes() {
    print_header "CREATING MONGODB INDEXES"
    
    local indexes_script='
    // Documents collection indexes
    db.documents.createIndex({ "organizationId": 1 });
    db.documents.createIndex({ "categoryId": 1 });
    db.documents.createIndex({ "title": "text", "description": "text", "tags": "text" });
    db.documents.createIndex({ "status": 1 });
    db.documents.createIndex({ "createdAt": -1 });
    db.documents.createIndex({ "organizationId": 1, "status": 1 });
    db.documents.createIndex({ "fileInfo.fileHash": 1 });
    
    // Document versions indexes
    db.documentVersions.createIndex({ "documentId": 1 });
    db.documentVersions.createIndex({ "documentId": 1, "versionNumber": 1 }, { unique: true });
    db.documentVersions.createIndex({ "isCurrentVersion": 1 });
    db.documentVersions.createIndex({ "createdAt": -1 });
    
    // RBI Circulars indexes
    db.rbiCirculars.createIndex({ "circularNumber": 1 }, { unique: true });
    db.rbiCirculars.createIndex({ "circularDate": -1 });
    db.rbiCirculars.createIndex({ "category": 1 });
    db.rbiCirculars.createIndex({ "impactLevel": 1 });
    db.rbiCirculars.createIndex({ "processingStatus": 1 });
    db.rbiCirculars.createIndex({ "title": "text", "content": "text", "summary": "text" });
    db.rbiCirculars.createIndex({ "subjectTags": 1 });
    db.rbiCirculars.createIndex({ "affectedEntities": 1 });
    
    // Workflow data indexes
    db.workflowData.createIndex({ "workflowInstanceId": 1 });
    db.workflowData.createIndex({ "organizationId": 1 });
    db.workflowData.createIndex({ "workflowType": 1 });
    db.workflowData.createIndex({ "status": 1 });
    db.workflowData.createIndex({ "createdAt": -1 });
    db.workflowData.createIndex({ "organizationId": 1, "status": 1 });
    
    // Risk analytics indexes
    db.riskAnalytics.createIndex({ "organizationId": 1 });
    db.riskAnalytics.createIndex({ "analysisType": 1 });
    db.riskAnalytics.createIndex({ "riskCategory": 1 });
    db.riskAnalytics.createIndex({ "analysisDate": -1 });
    db.riskAnalytics.createIndex({ "organizationId": 1, "analysisType": 1 });
    
    // Compliance evidence indexes
    db.complianceEvidence.createIndex({ "organizationId": 1 });
    db.complianceEvidence.createIndex({ "requirementId": 1 });
    db.complianceEvidence.createIndex({ "evidenceType": 1 });
    db.complianceEvidence.createIndex({ "isValidated": 1 });
    db.complianceEvidence.createIndex({ "evidenceDate": -1 });
    db.complianceEvidence.createIndex({ "organizationId": 1, "requirementId": 1 });
    
    print("Indexes created successfully");
    '
    
    execute_mongo_script "$indexes_script" "Creating indexes for optimal performance"
}

# Function to create sample data
create_sample_data() {
    print_status "Creating sample data..."
    
    local sample_data_script='
    // Insert sample RBI circular
    db.rbiCirculars.insertOne({
        circularNumber: "RBI/2024/001",
        title: "Sample RBI Circular for Testing",
        circularDate: new Date(),
        category: "Banking Regulation",
        subCategory: "Capital Adequacy",
        content: "This is a sample RBI circular for testing purposes.",
        summary: "Sample circular for system testing",
        impactLevel: "medium",
        affectedEntities: ["banks", "nbfcs"],
        processingStatus: "analyzed",
        subjectTags: ["capital", "adequacy", "testing"],
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // Insert sample document
    db.documents.insertOne({
        title: "Sample Compliance Document",
        description: "A sample document for testing",
        organizationId: "demo-org-id",
        categoryId: "compliance-category",
        documentType: "policy",
        fileInfo: {
            originalFilename: "sample-policy.pdf",
            fileSize: 1024000,
            mimeType: "application/pdf",
            fileHash: "sample-hash-123"
        },
        status: "published",
        tags: ["policy", "compliance", "sample"],
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    print("Sample data created successfully");
    '
    
    execute_mongo_script "$sample_data_script" "Creating sample data"
}

# Function to run database tests
run_mongodb_tests() {
    print_status "Running MongoDB tests..."
    
    local test_script='
    // Test basic functionality
    print("=== MongoDB Database Tests ===");
    
    // Test 1: Connection test
    try {
        db.adminCommand("ping");
        print("✓ Database connection test: PASS");
    } catch (e) {
        print("✗ Database connection test: FAIL - " + e);
    }
    
    // Test 2: Collections test
    var collections = db.getCollectionNames();
    if (collections.length > 0) {
        print("✓ Collections test: PASS (" + collections.length + " collections found)");
        print("  Collections: " + collections.join(", "));
    } else {
        print("✗ Collections test: FAIL - No collections found");
    }
    
    // Test 3: Indexes test
    var documentIndexes = db.documents.getIndexes();
    if (documentIndexes.length > 1) {
        print("✓ Indexes test: PASS (" + documentIndexes.length + " indexes on documents collection)");
    } else {
        print("✗ Indexes test: FAIL - Insufficient indexes");
    }
    
    // Test 4: Sample data test
    var circularCount = db.rbiCirculars.countDocuments();
    var documentCount = db.documents.countDocuments();
    print("✓ Sample data test: " + circularCount + " circulars, " + documentCount + " documents");
    
    print("=== Tests Completed ===");
    '
    
    docker exec rbi-mongodb mongosh "$MONGO_DB" --eval "$test_script"
}

# Function to show database statistics
show_database_stats() {
    print_header "MONGODB DATABASE STATISTICS"
    
    local stats_script='
    print("=== Database Statistics ===");
    print("Database: " + db.getName());
    
    var collections = db.getCollectionNames();
    print("Total Collections: " + collections.length);
    
    collections.forEach(function(collectionName) {
        var count = db.getCollection(collectionName).countDocuments();
        var indexes = db.getCollection(collectionName).getIndexes().length;
        print("  " + collectionName + ": " + count + " documents, " + indexes + " indexes");
    });
    
    var stats = db.stats();
    print("Database Size: " + Math.round(stats.dataSize / 1024 / 1024 * 100) / 100 + " MB");
    print("Index Size: " + Math.round(stats.indexSize / 1024 / 1024 * 100) / 100 + " MB");
    '
    
    docker exec rbi-mongodb mongosh "$MONGO_DB" --eval "$stats_script"
}

# Main execution
main() {
    print_header "MONGODB DATABASE SETUP"
    
    # Check if MongoDB is running
    if ! check_mongodb; then
        exit 1
    fi
    
    # Setup collections
    setup_collections
    
    # Create indexes
    create_indexes
    
    # Create sample data
    create_sample_data
    
    # Run tests
    run_mongodb_tests
    
    # Show statistics
    show_database_stats
    
    print_header "MONGODB SETUP COMPLETE"
    print_success "MongoDB is ready for use!"
    
    print_status "Connection details:"
    echo "  Host: $MONGO_HOST"
    echo "  Port: $MONGO_PORT"
    echo "  Database: $MONGO_DB"
    echo ""
    print_status "You can connect using:"
    echo "  docker exec -it rbi-mongodb mongosh $MONGO_DB"
    echo "  or use Mongo Express at: http://localhost:8081"
}

# Run main function
main "$@"
