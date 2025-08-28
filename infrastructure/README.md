# RBI Compliance Platform - Cloud Infrastructure

This directory contains the complete cloud infrastructure configuration for deploying the RBI Compliance Platform on AWS and Azure using Terraform.

## 📁 Directory Structure

```
infrastructure/
├── aws/
│   ├── main.tf                 # Main AWS infrastructure
│   ├── variables.tf            # AWS variables
│   ├── outputs.tf              # AWS outputs
│   ├── storage.tf              # S3 and EFS configuration
│   ├── iam.tf                  # IAM roles and policies
│   └── terraform.tfvars.example # Example variables file
├── azure/
│   ├── main.tf                 # Main Azure infrastructure
│   ├── variables.tf            # Azure variables
│   ├── outputs.tf              # Azure outputs
│   └── terraform.tfvars.example # Example variables file
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Terraform**: v1.0+ installed
2. **Cloud CLI**: AWS CLI or Azure CLI configured
3. **Credentials**: Proper cloud provider credentials configured
4. **Permissions**: Admin-level permissions for resource creation

### One-Command Deployment

```bash
# AWS Production Deployment
./deploy.sh -c aws -e prod -a apply

# Azure Staging Deployment
./deploy.sh -c azure -e staging -a apply

# Plan before deployment
./deploy.sh -c aws -e prod -a plan
```

### Manual Deployment

#### AWS Deployment

```bash
# 1. Navigate to AWS directory
cd aws/

# 2. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Initialize Terraform
terraform init

# 4. Plan deployment
terraform plan -var-file="terraform.tfvars"

# 5. Apply infrastructure
terraform apply -var-file="terraform.tfvars"

# 6. Update kubeconfig
aws eks update-kubeconfig --region ap-south-1 --name rbi-compliance-prod
```

#### Azure Deployment

```bash
# 1. Navigate to Azure directory
cd azure/

# 2. Create terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Initialize Terraform
terraform init

# 4. Plan deployment
terraform plan -var-file="terraform.tfvars"

# 5. Apply infrastructure
terraform apply -var-file="terraform.tfvars"

# 6. Update kubeconfig
az aks get-credentials --resource-group rbi-compliance-prod-rg --name rbi-compliance-prod
```

## 🏗️ Infrastructure Architecture

### AWS Architecture

#### **Core Components**
- **VPC**: Multi-AZ virtual private cloud with public/private subnets
- **EKS**: Managed Kubernetes cluster with auto-scaling node groups
- **RDS**: PostgreSQL database with Multi-AZ deployment
- **ElastiCache**: Redis cluster for caching and sessions
- **S3**: Multiple buckets for data, documents, backups, and logs
- **EFS**: Shared file system for persistent storage

#### **Security & Networking**
- **Security Groups**: Micro-segmentation for all services
- **IAM Roles**: Service accounts with least-privilege access
- **KMS**: Encryption keys for data at rest
- **VPC Flow Logs**: Network traffic monitoring
- **Private Subnets**: Database and application isolation

#### **Monitoring & Logging**
- **CloudWatch**: Metrics and log aggregation
- **VPC Flow Logs**: Network monitoring
- **RDS Performance Insights**: Database performance monitoring

### Azure Architecture

#### **Core Components**
- **Virtual Network**: Multi-subnet network with NSGs
- **AKS**: Managed Kubernetes cluster with auto-scaling
- **PostgreSQL Flexible Server**: Managed database with HA
- **Azure Cache for Redis**: Managed Redis service
- **Storage Account**: Blob storage for data and backups
- **Key Vault**: Secrets and certificate management

#### **Security & Networking**
- **Network Security Groups**: Traffic filtering and segmentation
- **Azure AD Integration**: Identity and access management
- **Private Endpoints**: Secure service connectivity
- **Azure Policy**: Governance and compliance

#### **Monitoring & Logging**
- **Log Analytics**: Centralized logging and monitoring
- **Container Insights**: AKS monitoring and diagnostics
- **Azure Monitor**: Comprehensive monitoring solution

## 🔧 Configuration

### Environment-Specific Settings

#### **Development Environment**
- **Compute**: Smaller instance sizes for cost optimization
- **Database**: Single-zone deployment with basic backup
- **Storage**: Local redundancy for cost savings
- **Monitoring**: Basic monitoring and shorter retention

#### **Staging Environment**
- **Compute**: Production-like sizing for testing
- **Database**: Multi-zone with geo-redundant backup
- **Storage**: Zone-redundant storage
- **Monitoring**: Full monitoring with medium retention

#### **Production Environment**
- **Compute**: High-availability with auto-scaling
- **Database**: Multi-zone with automated backup and HA
- **Storage**: Geo-redundant with lifecycle policies
- **Monitoring**: Comprehensive monitoring with long retention

### Key Configuration Files

#### **terraform.tfvars Example (AWS)**
```hcl
# Environment Configuration
environment = "prod"
aws_region = "ap-south-1"

# Database Configuration
database_password = "your-secure-password"
redis_auth_token = "your-redis-token"

# Networking
vpc_cidr = "10.0.0.0/16"

# Compute
node_instance_types = ["t3.large", "t3.xlarge"]
node_group_desired_size = 5

# Storage
rds_instance_class = "db.r5.xlarge"
redis_node_type = "cache.r5.large"
```

#### **terraform.tfvars Example (Azure)**
```hcl
# Environment Configuration
environment = "prod"
azure_location = "Central India"

# Database Configuration
database_password = "your-secure-password"

# Networking
vnet_cidr = "10.0.0.0/16"

# Compute
node_vm_size = "Standard_D4s_v3"
node_count = 5

# Storage
postgres_sku_name = "GP_Standard_D4s_v3"
redis_sku_name = "Premium"
```

## 🔐 Security Features

### AWS Security

#### **Network Security**
- **VPC**: Isolated network environment
- **Security Groups**: Stateful firewall rules
- **NACLs**: Additional network-level security
- **Private Subnets**: Database and application isolation

#### **Identity & Access**
- **IAM Roles**: Service-specific permissions
- **OIDC Provider**: Kubernetes service account integration
- **Cross-account Roles**: Secure service communication

#### **Data Protection**
- **KMS Encryption**: Data at rest encryption
- **TLS**: Data in transit encryption
- **S3 Bucket Policies**: Access control and encryption
- **RDS Encryption**: Database encryption

### Azure Security

#### **Network Security**
- **Virtual Network**: Isolated network environment
- **NSGs**: Network traffic filtering
- **Private Endpoints**: Secure service connectivity
- **Azure Firewall**: Advanced threat protection

#### **Identity & Access**
- **Azure AD**: Identity and access management
- **Managed Identity**: Service authentication
- **RBAC**: Role-based access control
- **Key Vault**: Secrets management

#### **Data Protection**
- **Azure Encryption**: Data at rest encryption
- **TLS**: Data in transit encryption
- **Storage Encryption**: Automatic blob encryption
- **Database Encryption**: Transparent data encryption

## 📊 Monitoring & Observability

### AWS Monitoring

#### **Infrastructure Monitoring**
- **CloudWatch Metrics**: System and application metrics
- **CloudWatch Logs**: Centralized log aggregation
- **VPC Flow Logs**: Network traffic analysis
- **AWS Config**: Configuration compliance

#### **Application Monitoring**
- **Container Insights**: EKS cluster monitoring
- **RDS Performance Insights**: Database performance
- **ElastiCache Metrics**: Cache performance monitoring

### Azure Monitoring

#### **Infrastructure Monitoring**
- **Azure Monitor**: Comprehensive monitoring platform
- **Log Analytics**: Centralized logging and analysis
- **Network Watcher**: Network monitoring and diagnostics
- **Azure Security Center**: Security monitoring

#### **Application Monitoring**
- **Container Insights**: AKS cluster monitoring
- **Database Monitoring**: PostgreSQL performance insights
- **Redis Monitoring**: Cache performance metrics

## 💰 Cost Optimization

### AWS Cost Optimization

#### **Compute Optimization**
- **Spot Instances**: Up to 90% cost savings for non-critical workloads
- **Auto Scaling**: Dynamic resource allocation
- **Reserved Instances**: Long-term cost savings
- **Right-sizing**: Optimal instance selection

#### **Storage Optimization**
- **S3 Lifecycle Policies**: Automatic tier transitions
- **EBS GP3**: Cost-effective storage with better performance
- **Data Compression**: Reduced storage costs

### Azure Cost Optimization

#### **Compute Optimization**
- **Spot VMs**: Significant cost savings for batch workloads
- **Auto Scaling**: Dynamic resource allocation
- **Reserved Instances**: Long-term cost savings
- **Azure Hybrid Benefit**: License cost savings

#### **Storage Optimization**
- **Storage Tiers**: Automatic tier transitions
- **Lifecycle Management**: Cost-effective data management
- **Compression**: Reduced storage costs

## 🔄 Operations

### Deployment Commands

```bash
# Plan infrastructure changes
./deploy.sh -c aws -e prod -a plan

# Deploy infrastructure
./deploy.sh -c aws -e prod -a apply

# Destroy infrastructure
./deploy.sh -c aws -e prod -a destroy

# Check Terraform state
terraform state list

# Import existing resources
terraform import aws_instance.example i-1234567890abcdef0
```

### Maintenance Tasks

#### **Regular Maintenance**
```bash
# Update Terraform providers
terraform init -upgrade

# Validate configuration
terraform validate

# Format configuration files
terraform fmt -recursive

# Check for security issues
terraform plan -out=tfplan
terraform show -json tfplan | tfsec --stdin
```

#### **Backup and Recovery**
```bash
# Backup Terraform state
terraform state pull > terraform.tfstate.backup

# List all resources
terraform state list

# Show specific resource
terraform state show aws_instance.example
```

### Troubleshooting

#### **Common Issues**

1. **Authentication Errors**
   ```bash
   # AWS
   aws sts get-caller-identity
   aws configure list
   
   # Azure
   az account show
   az login --tenant <tenant-id>
   ```

2. **Resource Conflicts**
   ```bash
   # Check existing resources
   terraform import <resource_type>.<name> <resource_id>
   
   # Remove from state
   terraform state rm <resource_type>.<name>
   ```

3. **State Lock Issues**
   ```bash
   # Force unlock (use with caution)
   terraform force-unlock <lock-id>
   ```

## 🚨 Disaster Recovery

### Backup Strategy

#### **AWS Backup Strategy**
- **RDS**: Automated backups with point-in-time recovery
- **S3**: Cross-region replication for critical data
- **EBS**: Automated snapshots with lifecycle management
- **Terraform State**: S3 versioning and cross-region replication

#### **Azure Backup Strategy**
- **PostgreSQL**: Automated backups with geo-redundancy
- **Storage Account**: Geo-redundant storage with versioning
- **AKS**: Velero for cluster backup and restore
- **Terraform State**: Storage account with versioning

### Recovery Procedures

#### **Database Recovery**
```bash
# AWS RDS Point-in-time Recovery
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier mydb \
  --target-db-instance-identifier mydb-restored \
  --restore-time 2023-12-01T12:00:00.000Z

# Azure PostgreSQL Recovery
az postgres flexible-server restore \
  --resource-group myResourceGroup \
  --name mydemoserver-restored \
  --source-server mydemoserver \
  --restore-time 2023-12-01T12:00:00Z
```

## 📚 Additional Resources

### Documentation Links
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)

### Support
- **Technical Support**: devops@rbi-compliance.com
- **Emergency Support**: emergency@rbi-compliance.com
- **Documentation**: https://docs.rbi-compliance.com

---

**Note**: This infrastructure configuration is designed for production use. Ensure you review and customize the settings according to your specific requirements and security policies before deployment.
