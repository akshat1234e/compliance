# Azure Infrastructure Variables

variable "azure_location" {
  description = "Azure region for resources"
  type        = string
  default     = "Central India"
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

# Virtual Network Configuration
variable "vnet_cidr" {
  description = "CIDR block for Virtual Network"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aks_subnet_cidr" {
  description = "CIDR block for AKS subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "database_subnet_cidr" {
  description = "CIDR block for database subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_endpoint_subnet_cidr" {
  description = "CIDR block for private endpoints subnet"
  type        = string
  default     = "10.0.3.0/24"
}

# AKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28.3"
}

variable "node_count" {
  description = "Initial number of nodes in the default node pool"
  type        = number
  default     = 3
}

variable "node_min_count" {
  description = "Minimum number of nodes in the default node pool"
  type        = number
  default     = 2
}

variable "node_max_count" {
  description = "Maximum number of nodes in the default node pool"
  type        = number
  default     = 10
}

variable "node_vm_size" {
  description = "VM size for default node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "spot_vm_size" {
  description = "VM size for spot node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "spot_node_count" {
  description = "Initial number of nodes in the spot node pool"
  type        = number
  default     = 2
}

variable "spot_max_count" {
  description = "Maximum number of nodes in the spot node pool"
  type        = number
  default     = 10
}

variable "spot_max_price" {
  description = "Maximum price for spot instances"
  type        = number
  default     = 0.5
}

variable "service_cidr" {
  description = "CIDR block for Kubernetes services"
  type        = string
  default     = "10.1.0.0/16"
}

variable "dns_service_ip" {
  description = "IP address for Kubernetes DNS service"
  type        = string
  default     = "10.1.0.10"
}

# PostgreSQL Configuration
variable "postgres_sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "GP_Standard_D4s_v3"
}

variable "postgres_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 131072  # 128 GB
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "rbi_compliance"
}

variable "database_username" {
  description = "Database administrator username"
  type        = string
  default     = "rbi_user"
}

variable "database_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_sku_name" {
  description = "Redis SKU name"
  type        = string
  default     = "Premium"
}

variable "redis_family" {
  description = "Redis family"
  type        = string
  default     = "P"
}

variable "redis_capacity" {
  description = "Redis capacity"
  type        = number
  default     = 1
}

variable "redis_maxmemory_reserved" {
  description = "Redis maxmemory reserved"
  type        = number
  default     = 10
}

variable "redis_maxmemory_delta" {
  description = "Redis maxmemory delta"
  type        = number
  default     = 2
}

# Storage Configuration
variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "storage_replication_type" {
  description = "Storage replication type"
  type        = string
  default     = "GRS"
}

# Monitoring Configuration
variable "log_retention_days" {
  description = "Log Analytics workspace retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable Container Insights for AKS"
  type        = bool
  default     = true
}

# Security Configuration
variable "enable_azure_policy" {
  description = "Enable Azure Policy for AKS"
  type        = bool
  default     = true
}

variable "enable_key_vault_secrets_provider" {
  description = "Enable Key Vault Secrets Provider for AKS"
  type        = bool
  default     = true
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity for AKS"
  type        = bool
  default     = true
}

# Backup Configuration
variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_geo_redundant_backup" {
  description = "Enable geo-redundant backup"
  type        = bool
  default     = true
}

# Network Security
variable "enable_private_cluster" {
  description = "Enable private AKS cluster"
  type        = bool
  default     = false
}

variable "authorized_ip_ranges" {
  description = "Authorized IP ranges for AKS API server"
  type        = list(string)
  default     = []
}

# Cost Optimization
variable "enable_spot_node_pool" {
  description = "Enable spot node pool for cost optimization"
  type        = bool
  default     = true
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for node pools"
  type        = bool
  default     = true
}

# Application Gateway Configuration
variable "enable_application_gateway" {
  description = "Enable Application Gateway Ingress Controller"
  type        = bool
  default     = true
}

variable "app_gateway_sku" {
  description = "Application Gateway SKU"
  type        = string
  default     = "Standard_v2"
}

# DNS Configuration
variable "dns_zone_name" {
  description = "DNS zone name"
  type        = string
  default     = "rbi-compliance.com"
}

variable "create_dns_zone" {
  description = "Create DNS zone"
  type        = bool
  default     = true
}

# Certificate Configuration
variable "enable_cert_manager" {
  description = "Enable cert-manager for SSL certificates"
  type        = bool
  default     = true
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
    node_count                    = number
    node_min_count               = number
    node_max_count               = number
    node_vm_size                 = string
    postgres_sku_name            = string
    postgres_storage_mb          = number
    redis_sku_name               = string
    redis_capacity               = number
    storage_replication_type     = string
    backup_retention_days        = number
    enable_geo_redundant_backup  = bool
    log_retention_days           = number
  }))
  default = {
    dev = {
      node_count                   = 2
      node_min_count              = 1
      node_max_count              = 5
      node_vm_size                = "Standard_D2s_v3"
      postgres_sku_name           = "B_Standard_B2s"
      postgres_storage_mb         = 32768  # 32 GB
      redis_sku_name              = "Basic"
      redis_capacity              = 0
      storage_replication_type    = "LRS"
      backup_retention_days       = 7
      enable_geo_redundant_backup = false
      log_retention_days          = 7
    }
    staging = {
      node_count                   = 3
      node_min_count              = 2
      node_max_count              = 8
      node_vm_size                = "Standard_D2s_v3"
      postgres_sku_name           = "GP_Standard_D2s_v3"
      postgres_storage_mb         = 65536  # 64 GB
      redis_sku_name              = "Standard"
      redis_capacity              = 1
      storage_replication_type    = "GRS"
      backup_retention_days       = 14
      enable_geo_redundant_backup = true
      log_retention_days          = 14
    }
    prod = {
      node_count                   = 5
      node_min_count              = 3
      node_max_count              = 20
      node_vm_size                = "Standard_D4s_v3"
      postgres_sku_name           = "GP_Standard_D4s_v3"
      postgres_storage_mb         = 131072  # 128 GB
      redis_sku_name              = "Premium"
      redis_capacity              = 1
      storage_replication_type    = "GRS"
      backup_retention_days       = 35
      enable_geo_redundant_backup = true
      log_retention_days          = 30
    }
  }
}

# Compliance and Governance
variable "enable_azure_defender" {
  description = "Enable Azure Defender for security"
  type        = bool
  default     = true
}

variable "enable_diagnostic_settings" {
  description = "Enable diagnostic settings for all resources"
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
  default     = "South India"
}
