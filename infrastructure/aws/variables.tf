# AWS Infrastructure Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "rbi-compliance"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# EKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_types" {
  description = "Instance types for EKS managed node groups"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "spot_instance_types" {
  description = "Instance types for spot node groups"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge", "m5.large", "m5.xlarge"]
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the node group"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the node group"
  type        = number
  default     = 3
}

# RDS Configuration
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.large"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (GB)"
  type        = number
  default     = 1000
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "rbi_compliance"
}

variable "database_username" {
  description = "Database master username"
  type        = string
  default     = "rbi_user"
}

variable "database_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_auth_token" {
  description = "Auth token for Redis cluster"
  type        = string
  sensitive   = true
}

# S3 Configuration
variable "s3_bucket_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "rbi-compliance"
}

# Application Load Balancer Configuration
variable "enable_deletion_protection" {
  description = "Enable deletion protection for ALB"
  type        = bool
  default     = true
}

# CloudWatch Configuration
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

# Monitoring Configuration
variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring for EC2 instances"
  type        = bool
  default     = true
}

# Security Configuration
variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty"
  type        = bool
  default     = true
}

variable "enable_config" {
  description = "Enable AWS Config"
  type        = bool
  default     = true
}

# Certificate Configuration
variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
  default     = "rbi-compliance.com"
}

variable "alternative_domain_names" {
  description = "Alternative domain names for SSL certificate"
  type        = list(string)
  default     = ["*.rbi-compliance.com", "api.rbi-compliance.com"]
}

# Route53 Configuration
variable "create_route53_zone" {
  description = "Create Route53 hosted zone"
  type        = bool
  default     = true
}

# WAF Configuration
variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

# Auto Scaling Configuration
variable "enable_cluster_autoscaler" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

# Cost Optimization
variable "enable_spot_instances" {
  description = "Enable spot instances for cost optimization"
  type        = bool
  default     = true
}

# Compliance and Governance
variable "enable_cloudtrail" {
  description = "Enable AWS CloudTrail"
  type        = bool
  default     = true
}

variable "enable_secrets_manager" {
  description = "Enable AWS Secrets Manager for sensitive data"
  type        = bool
  default     = true
}

# Disaster Recovery
variable "enable_cross_region_backup" {
  description = "Enable cross-region backup"
  type        = bool
  default     = true
}

variable "backup_region" {
  description = "Region for cross-region backups"
  type        = string
  default     = "ap-southeast-1"
}

# AWS Auth Users for EKS
variable "aws_auth_users" {
  description = "List of AWS users to add to aws-auth configmap"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

# AWS Auth Roles for EKS
variable "aws_auth_roles" {
  description = "List of AWS roles to add to aws-auth configmap"
  type = list(object({
    rolearn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Environment-specific configurations
variable "environment_configs" {
  description = "Environment-specific configurations"
  type = map(object({
    node_group_min_size     = number
    node_group_max_size     = number
    node_group_desired_size = number
    rds_instance_class      = string
    redis_node_type         = string
    backup_retention_days   = number
    enable_deletion_protection = bool
  }))
  default = {
    dev = {
      node_group_min_size        = 1
      node_group_max_size        = 3
      node_group_desired_size    = 2
      rds_instance_class         = "db.t3.medium"
      redis_node_type           = "cache.t3.micro"
      backup_retention_days     = 7
      enable_deletion_protection = false
    }
    staging = {
      node_group_min_size        = 2
      node_group_max_size        = 5
      node_group_desired_size    = 3
      rds_instance_class         = "db.t3.large"
      redis_node_type           = "cache.t3.small"
      backup_retention_days     = 14
      enable_deletion_protection = false
    }
    prod = {
      node_group_min_size        = 3
      node_group_max_size        = 15
      node_group_desired_size    = 5
      rds_instance_class         = "db.r5.xlarge"
      redis_node_type           = "cache.r5.large"
      backup_retention_days     = 30
      enable_deletion_protection = true
    }
  }
}
