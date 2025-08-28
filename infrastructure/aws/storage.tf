# S3 Buckets and Storage Configuration

# S3 Bucket for Application Data
resource "aws_s3_bucket" "app_data" {
  bucket = "${var.s3_bucket_prefix}-${var.environment}-app-data"

  tags = merge(local.common_tags, {
    Name        = "${var.s3_bucket_prefix}-${var.environment}-app-data"
    Purpose     = "Application Data Storage"
    DataClass   = "Confidential"
  })
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# S3 Bucket for Document Storage
resource "aws_s3_bucket" "documents" {
  bucket = "${var.s3_bucket_prefix}-${var.environment}-documents"

  tags = merge(local.common_tags, {
    Name        = "${var.s3_bucket_prefix}-${var.environment}-documents"
    Purpose     = "Document Storage"
    DataClass   = "Confidential"
  })
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "documents" {
  bucket = aws_s3_bucket.documents.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Backups
resource "aws_s3_bucket" "backups" {
  bucket = "${var.s3_bucket_prefix}-${var.environment}-backups"

  tags = merge(local.common_tags, {
    Name        = "${var.s3_bucket_prefix}-${var.environment}-backups"
    Purpose     = "Backup Storage"
    DataClass   = "Critical"
  })
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "backups" {
  bucket = aws_s3_bucket.backups.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.s3.arn
        sse_algorithm     = "aws:kms"
      }
      bucket_key_enabled = true
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = var.environment == "prod" ? 2555 : 365  # 7 years for prod, 1 year for others
    }
  }
}

# S3 Bucket for Logs
resource "aws_s3_bucket" "logs" {
  bucket = "${var.s3_bucket_prefix}-${var.environment}-logs"

  tags = merge(local.common_tags, {
    Name        = "${var.s3_bucket_prefix}-${var.environment}-logs"
    Purpose     = "Log Storage"
    DataClass   = "Internal"
  })
}

resource "aws_s3_bucket_encryption" "logs" {
  bucket = aws_s3_bucket.logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log_lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = var.environment == "prod" ? 2555 : 90  # 7 years for prod, 90 days for others
    }
  }
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-s3-kms-key"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.cluster_name}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# EFS File System for Shared Storage
resource "aws_efs_file_system" "shared" {
  creation_token = "${local.cluster_name}-shared-storage"
  
  performance_mode = "generalPurpose"
  throughput_mode  = "provisioned"
  provisioned_throughput_in_mibps = var.environment == "prod" ? 100 : 50

  encrypted  = true
  kms_key_id = aws_kms_key.efs.arn

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-shared-storage"
  })
}

resource "aws_efs_mount_target" "shared" {
  count = length(module.vpc.private_subnets)

  file_system_id  = aws_efs_file_system.shared.id
  subnet_id       = module.vpc.private_subnets[count.index]
  security_groups = [aws_security_group.efs.id]
}

resource "aws_security_group" "efs" {
  name_prefix = "${local.cluster_name}-efs-"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "NFS"
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-efs-sg"
  })
}

# KMS Key for EFS Encryption
resource "aws_kms_key" "efs" {
  description             = "KMS key for EFS encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-efs-kms-key"
  })
}

resource "aws_kms_alias" "efs" {
  name          = "alias/${local.cluster_name}-efs"
  target_key_id = aws_kms_key.efs.key_id
}

# EBS Storage Classes
resource "aws_ebs_encryption_by_default" "enabled" {
  enabled = true
}

resource "aws_ebs_default_kms_key" "default" {
  key_id = aws_kms_key.ebs.arn
}

# KMS Key for EBS Encryption
resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS encryption"
  deletion_window_in_days = var.environment == "prod" ? 30 : 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-ebs-kms-key"
  })
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.cluster_name}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}
