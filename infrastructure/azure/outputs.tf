# Azure Infrastructure Outputs

# Resource Group Outputs
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# Virtual Network Outputs
output "vnet_id" {
  description = "ID of the Virtual Network"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Name of the Virtual Network"
  value       = azurerm_virtual_network.main.name
}

output "vnet_address_space" {
  description = "Address space of the Virtual Network"
  value       = azurerm_virtual_network.main.address_space
}

output "aks_subnet_id" {
  description = "ID of the AKS subnet"
  value       = azurerm_subnet.aks.id
}

output "database_subnet_id" {
  description = "ID of the database subnet"
  value       = azurerm_subnet.database.id
}

output "private_endpoints_subnet_id" {
  description = "ID of the private endpoints subnet"
  value       = azurerm_subnet.private_endpoints.id
}

# AKS Cluster Outputs
output "aks_cluster_id" {
  description = "AKS cluster ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "aks_cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = azurerm_kubernetes_cluster.main.fqdn
}

output "aks_cluster_endpoint" {
  description = "AKS cluster endpoint"
  value       = azurerm_kubernetes_cluster.main.kube_config.0.host
  sensitive   = true
}

output "aks_cluster_ca_certificate" {
  description = "AKS cluster CA certificate"
  value       = azurerm_kubernetes_cluster.main.kube_config.0.cluster_ca_certificate
  sensitive   = true
}

output "aks_client_certificate" {
  description = "AKS client certificate"
  value       = azurerm_kubernetes_cluster.main.kube_config.0.client_certificate
  sensitive   = true
}

output "aks_client_key" {
  description = "AKS client key"
  value       = azurerm_kubernetes_cluster.main.kube_config.0.client_key
  sensitive   = true
}

output "aks_kube_config" {
  description = "AKS kubeconfig"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "aks_identity_principal_id" {
  description = "AKS cluster identity principal ID"
  value       = azurerm_kubernetes_cluster.main.identity[0].principal_id
}

output "aks_identity_tenant_id" {
  description = "AKS cluster identity tenant ID"
  value       = azurerm_kubernetes_cluster.main.identity[0].tenant_id
}

output "aks_kubelet_identity_object_id" {
  description = "AKS kubelet identity object ID"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "aks_kubelet_identity_client_id" {
  description = "AKS kubelet identity client ID"
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].client_id
}

# PostgreSQL Outputs
output "postgres_server_id" {
  description = "PostgreSQL server ID"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "postgres_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgres_server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
  sensitive   = true
}

output "postgres_database_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

# Redis Outputs
output "redis_cache_id" {
  description = "Redis cache ID"
  value       = azurerm_redis_cache.main.id
}

output "redis_cache_name" {
  description = "Redis cache name"
  value       = azurerm_redis_cache.main.name
}

output "redis_cache_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
  sensitive   = true
}

output "redis_cache_port" {
  description = "Redis cache port"
  value       = azurerm_redis_cache.main.port
}

output "redis_cache_ssl_port" {
  description = "Redis cache SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_access_key" {
  description = "Redis primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "redis_secondary_access_key" {
  description = "Redis secondary access key"
  value       = azurerm_redis_cache.main.secondary_access_key
  sensitive   = true
}

# Storage Account Outputs
output "storage_account_id" {
  description = "Storage account ID"
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "storage_account_primary_endpoint" {
  description = "Storage account primary blob endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "storage_account_primary_access_key" {
  description = "Storage account primary access key"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "storage_account_secondary_access_key" {
  description = "Storage account secondary access key"
  value       = azurerm_storage_account.main.secondary_access_key
  sensitive   = true
}

output "storage_account_connection_string" {
  description = "Storage account connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

# Storage Container Outputs
output "storage_container_app_data" {
  description = "App data storage container name"
  value       = azurerm_storage_container.app_data.name
}

output "storage_container_documents" {
  description = "Documents storage container name"
  value       = azurerm_storage_container.documents.name
}

output "storage_container_backups" {
  description = "Backups storage container name"
  value       = azurerm_storage_container.backups.name
}

# Key Vault Outputs
output "key_vault_id" {
  description = "Key Vault ID"
  value       = azurerm_key_vault.main.id
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# Log Analytics Outputs
output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  description = "Log Analytics workspace name"
  value       = azurerm_log_analytics_workspace.main.name
}

output "log_analytics_workspace_workspace_id" {
  description = "Log Analytics workspace workspace ID"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

output "log_analytics_primary_shared_key" {
  description = "Log Analytics primary shared key"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}

# Network Security Group Outputs
output "aks_nsg_id" {
  description = "AKS network security group ID"
  value       = azurerm_network_security_group.aks.id
}

output "database_nsg_id" {
  description = "Database network security group ID"
  value       = azurerm_network_security_group.database.id
}

# Configuration for kubectl
output "configure_kubectl" {
  description = "Configure kubectl: run the following command to update your kubeconfig"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${azurerm_kubernetes_cluster.main.name}"
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "location" {
  description = "Azure location"
  value       = var.azure_location
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = local.cluster_name
}

# Connection Information
output "connection_info" {
  description = "Connection information for services"
  value = {
    cluster_endpoint = azurerm_kubernetes_cluster.main.kube_config.0.host
    database_endpoint = azurerm_postgresql_flexible_server.main.fqdn
    redis_endpoint = azurerm_redis_cache.main.hostname
    storage_account = azurerm_storage_account.main.name
    key_vault_uri = azurerm_key_vault.main.vault_uri
    log_analytics_workspace = azurerm_log_analytics_workspace.main.workspace_id
  }
  sensitive = true
}

# Resource URLs for Azure Portal
output "azure_portal_urls" {
  description = "Azure Portal URLs for resources"
  value = {
    resource_group = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource/subscriptions/${data.azurerm_client_config.current.subscription_id}/resourceGroups/${azurerm_resource_group.main.name}"
    aks_cluster = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_kubernetes_cluster.main.id}"
    postgres_server = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_postgresql_flexible_server.main.id}"
    redis_cache = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_redis_cache.main.id}"
    storage_account = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_storage_account.main.id}"
    key_vault = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_key_vault.main.id}"
    log_analytics = "https://portal.azure.com/#@${data.azurerm_client_config.current.tenant_id}/resource${azurerm_log_analytics_workspace.main.id}"
  }
}
