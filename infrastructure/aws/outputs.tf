# AWS Infrastructure Outputs

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of IDs of database subnets"
  value       = module.vpc.database_subnets
}

# EKS Cluster Outputs
output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = module.eks.cluster_iam_role_arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider if enabled"
  value       = module.eks.oidc_provider_arn
}

# Node Groups Outputs
output "eks_managed_node_groups" {
  description = "Map of attribute maps for all EKS managed node groups created"
  value       = module.eks.eks_managed_node_groups
}

# RDS Outputs
output "db_instance_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.postgres.arn
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.postgres.id
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.postgres.port
}

output "db_subnet_group_id" {
  description = "RDS subnet group ID"
  value       = aws_db_subnet_group.main.id
}

# ElastiCache Outputs
output "redis_cluster_address" {
  description = "Redis cluster hostname"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "redis_cluster_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_replication_group.redis.id
}

# S3 Outputs
output "s3_bucket_app_data_id" {
  description = "S3 bucket ID for application data"
  value       = aws_s3_bucket.app_data.id
}

output "s3_bucket_app_data_arn" {
  description = "S3 bucket ARN for application data"
  value       = aws_s3_bucket.app_data.arn
}

output "s3_bucket_documents_id" {
  description = "S3 bucket ID for documents"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_documents_arn" {
  description = "S3 bucket ARN for documents"
  value       = aws_s3_bucket.documents.arn
}

output "s3_bucket_backups_id" {
  description = "S3 bucket ID for backups"
  value       = aws_s3_bucket.backups.id
}

output "s3_bucket_backups_arn" {
  description = "S3 bucket ARN for backups"
  value       = aws_s3_bucket.backups.arn
}

output "s3_bucket_logs_id" {
  description = "S3 bucket ID for logs"
  value       = aws_s3_bucket.logs.id
}

output "s3_bucket_logs_arn" {
  description = "S3 bucket ARN for logs"
  value       = aws_s3_bucket.logs.arn
}

# EFS Outputs
output "efs_file_system_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.shared.id
}

output "efs_file_system_arn" {
  description = "EFS file system ARN"
  value       = aws_efs_file_system.shared.arn
}

output "efs_mount_target_ids" {
  description = "EFS mount target IDs"
  value       = aws_efs_mount_target.shared[*].id
}

# KMS Outputs
output "kms_key_s3_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.id
}

output "kms_key_s3_arn" {
  description = "KMS key ARN for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "kms_key_ebs_id" {
  description = "KMS key ID for EBS encryption"
  value       = aws_kms_key.ebs.id
}

output "kms_key_ebs_arn" {
  description = "KMS key ARN for EBS encryption"
  value       = aws_kms_key.ebs.arn
}

output "kms_key_efs_id" {
  description = "KMS key ID for EFS encryption"
  value       = aws_kms_key.efs.id
}

output "kms_key_efs_arn" {
  description = "KMS key ARN for EFS encryption"
  value       = aws_kms_key.efs.arn
}

# IAM Outputs
output "aws_load_balancer_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}

output "ebs_csi_driver_role_arn" {
  description = "IAM role ARN for EBS CSI Driver"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "efs_csi_driver_role_arn" {
  description = "IAM role ARN for EFS CSI Driver"
  value       = aws_iam_role.efs_csi_driver.arn
}

output "cluster_autoscaler_role_arn" {
  description = "IAM role ARN for Cluster Autoscaler"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "app_s3_access_role_arn" {
  description = "IAM role ARN for application S3 access"
  value       = aws_iam_role.app_s3_access.arn
}

# Security Group Outputs
output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = aws_security_group.eks_cluster.id
}

output "eks_nodes_security_group_id" {
  description = "EKS nodes security group ID"
  value       = aws_security_group.eks_nodes.id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ElastiCache security group ID"
  value       = aws_security_group.elasticache.id
}

output "efs_security_group_id" {
  description = "EFS security group ID"
  value       = aws_security_group.efs.id
}

# Configuration for kubectl
output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${module.eks.cluster_id}"
}

# Environment Information
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = local.cluster_name
}

# Connection Information
output "connection_info" {
  description = "Connection information for services"
  value = {
    cluster_endpoint = module.eks.cluster_endpoint
    database_endpoint = aws_db_instance.postgres.endpoint
    redis_endpoint = aws_elasticache_replication_group.redis.primary_endpoint_address
    s3_buckets = {
      app_data  = aws_s3_bucket.app_data.id
      documents = aws_s3_bucket.documents.id
      backups   = aws_s3_bucket.backups.id
      logs      = aws_s3_bucket.logs.id
    }
  }
  sensitive = true
}
