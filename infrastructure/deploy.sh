#!/bin/bash

# RBI Compliance Platform - Cloud Infrastructure Deployment Script
# This script deploys the infrastructure to AWS or Azure

set -euo pipefail

# Make script executable
chmod +x "$0"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLOUD_PROVIDER=""
ENVIRONMENT="prod"
ACTION="plan"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Show usage
show_usage() {
    cat << EOF
RBI Compliance Platform - Cloud Infrastructure Deployment

Usage: $0 [OPTIONS]

Options:
    -c, --cloud PROVIDER     Cloud provider (aws|azure)
    -e, --environment ENV    Environment (dev|staging|prod) [default: prod]
    -a, --action ACTION      Terraform action (plan|apply|destroy) [default: plan]
    -h, --help              Show this help message

Examples:
    $0 -c aws -e prod -a plan          # Plan AWS production infrastructure
    $0 -c azure -e staging -a apply    # Deploy Azure staging infrastructure
    $0 -c aws -e dev -a destroy        # Destroy AWS development infrastructure

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--cloud)
                CLOUD_PROVIDER="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
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

    # Validate required parameters
    if [[ -z "$CLOUD_PROVIDER" ]]; then
        log_error "Cloud provider is required. Use -c aws or -c azure"
        show_usage
        exit 1
    fi

    if [[ "$CLOUD_PROVIDER" != "aws" && "$CLOUD_PROVIDER" != "azure" ]]; then
        log_error "Invalid cloud provider: $CLOUD_PROVIDER. Must be 'aws' or 'azure'"
        exit 1
    fi

    if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'dev', 'staging', or 'prod'"
        exit 1
    fi

    if [[ "$ACTION" != "plan" && "$ACTION" != "apply" && "$ACTION" != "destroy" ]]; then
        log_error "Invalid action: $ACTION. Must be 'plan', 'apply', or 'destroy'"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi

    # Check terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    log_info "Terraform version: $TERRAFORM_VERSION"

    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        # Check AWS CLI
        if ! command -v aws &> /dev/null; then
            log_error "AWS CLI is not installed. Please install AWS CLI first."
            exit 1
        fi

        # Check AWS credentials
        if ! aws sts get-caller-identity &> /dev/null; then
            log_error "AWS credentials not configured. Please run 'aws configure' first."
            exit 1
        fi

        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        AWS_REGION=$(aws configure get region)
        log_info "AWS Account ID: $AWS_ACCOUNT_ID"
        log_info "AWS Region: $AWS_REGION"

    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        # Check Azure CLI
        if ! command -v az &> /dev/null; then
            log_error "Azure CLI is not installed. Please install Azure CLI first."
            exit 1
        fi

        # Check Azure login
        if ! az account show &> /dev/null; then
            log_error "Not logged into Azure. Please run 'az login' first."
            exit 1
        fi

        AZURE_SUBSCRIPTION_ID=$(az account show --query id --output tsv)
        AZURE_TENANT_ID=$(az account show --query tenantId --output tsv)
        log_info "Azure Subscription ID: $AZURE_SUBSCRIPTION_ID"
        log_info "Azure Tenant ID: $AZURE_TENANT_ID"
    fi

    log_success "Prerequisites check passed"
}

# Setup Terraform backend
setup_backend() {
    log_info "Setting up Terraform backend..."

    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        # Create S3 bucket for Terraform state if it doesn't exist
        BUCKET_NAME="rbi-compliance-terraform-state-${ENVIRONMENT}"
        DYNAMODB_TABLE="rbi-compliance-terraform-locks-${ENVIRONMENT}"

        if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
            log_info "Creating S3 bucket for Terraform state: $BUCKET_NAME"
            aws s3 mb "s3://$BUCKET_NAME"
            aws s3api put-bucket-versioning --bucket "$BUCKET_NAME" --versioning-configuration Status=Enabled
            aws s3api put-bucket-encryption --bucket "$BUCKET_NAME" --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
        fi

        # Create DynamoDB table for state locking if it doesn't exist
        if ! aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" &> /dev/null; then
            log_info "Creating DynamoDB table for state locking: $DYNAMODB_TABLE"
            aws dynamodb create-table \
                --table-name "$DYNAMODB_TABLE" \
                --attribute-definitions AttributeName=LockID,AttributeType=S \
                --key-schema AttributeName=LockID,KeyType=HASH \
                --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
        fi

    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        # Create resource group and storage account for Terraform state if they don't exist
        RG_NAME="rbi-compliance-terraform-state-${ENVIRONMENT}"
        STORAGE_ACCOUNT="rbicomplterraform${ENVIRONMENT}"

        if ! az group show --name "$RG_NAME" &> /dev/null; then
            log_info "Creating resource group for Terraform state: $RG_NAME"
            az group create --name "$RG_NAME" --location "Central India"
        fi

        if ! az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RG_NAME" &> /dev/null; then
            log_info "Creating storage account for Terraform state: $STORAGE_ACCOUNT"
            az storage account create \
                --name "$STORAGE_ACCOUNT" \
                --resource-group "$RG_NAME" \
                --location "Central India" \
                --sku Standard_LRS \
                --encryption-services blob
        fi

        # Create container for Terraform state
        ACCOUNT_KEY=$(az storage account keys list --resource-group "$RG_NAME" --account-name "$STORAGE_ACCOUNT" --query '[0].value' --output tsv)
        az storage container create \
            --name tfstate \
            --account-name "$STORAGE_ACCOUNT" \
            --account-key "$ACCOUNT_KEY" \
            --public-access off &> /dev/null || true
    fi

    log_success "Terraform backend setup completed"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."

    cd "$SCRIPT_DIR/$CLOUD_PROVIDER"

    # Create terraform.tfvars file if it doesn't exist
    if [[ ! -f "terraform.tfvars" ]]; then
        log_info "Creating terraform.tfvars file..."
        cat > terraform.tfvars << EOF
environment = "$ENVIRONMENT"
EOF

        if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
            cat >> terraform.tfvars << EOF
aws_region = "ap-south-1"
database_password = "$(openssl rand -base64 32)"
redis_auth_token = "$(openssl rand -base64 32)"
EOF
        elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
            cat >> terraform.tfvars << EOF
azure_location = "Central India"
database_password = "$(openssl rand -base64 32)"
EOF
        fi

        log_warning "Generated terraform.tfvars file. Please review and update as needed."
    fi

    terraform init
    log_success "Terraform initialized"
}

# Run Terraform
run_terraform() {
    log_info "Running Terraform $ACTION..."

    cd "$SCRIPT_DIR/$CLOUD_PROVIDER"

    case $ACTION in
        plan)
            terraform plan -var-file="terraform.tfvars"
            ;;
        apply)
            terraform apply -var-file="terraform.tfvars" -auto-approve
            ;;
        destroy)
            log_warning "This will destroy all infrastructure resources!"
            read -p "Are you sure you want to continue? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                terraform destroy -var-file="terraform.tfvars" -auto-approve
            else
                log_info "Destroy cancelled"
                exit 0
            fi
            ;;
    esac

    log_success "Terraform $ACTION completed"
}

# Show outputs
show_outputs() {
    if [[ "$ACTION" == "apply" ]]; then
        log_info "Infrastructure outputs:"
        cd "$SCRIPT_DIR/$CLOUD_PROVIDER"
        terraform output

        log_info "Saving outputs to file..."
        terraform output -json > "../outputs-${CLOUD_PROVIDER}-${ENVIRONMENT}.json"
        log_success "Outputs saved to outputs-${CLOUD_PROVIDER}-${ENVIRONMENT}.json"
    fi
}

# Post-deployment setup
post_deployment() {
    if [[ "$ACTION" == "apply" ]]; then
        log_info "Running post-deployment setup..."

        cd "$SCRIPT_DIR/$CLOUD_PROVIDER"

        if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
            # Update kubeconfig
            CLUSTER_NAME=$(terraform output -raw cluster_name)
            AWS_REGION=$(terraform output -raw region)
            aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

        elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
            # Update kubeconfig
            CLUSTER_NAME=$(terraform output -raw aks_cluster_name)
            RG_NAME=$(terraform output -raw resource_group_name)
            az aks get-credentials --resource-group "$RG_NAME" --name "$CLUSTER_NAME"
        fi

        log_success "Post-deployment setup completed"
        log_info "You can now deploy the Kubernetes applications using the k8s deployment scripts"
    fi
}

# Main function
main() {
    log_info "Starting RBI Compliance Platform infrastructure deployment..."
    log_info "Cloud Provider: $CLOUD_PROVIDER"
    log_info "Environment: $ENVIRONMENT"
    log_info "Action: $ACTION"

    check_prerequisites
    setup_backend
    init_terraform
    run_terraform
    show_outputs
    post_deployment

    log_success "Infrastructure deployment completed successfully!"
}

# Parse arguments and run main function
parse_args "$@"
main
