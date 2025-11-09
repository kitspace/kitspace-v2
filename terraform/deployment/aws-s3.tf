# Reference existing production bucket for pre-release
data "aws_s3_bucket" "existing_production_bucket" {
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 1 : 0
  bucket = "kitspace-production"
}

resource "aws_s3_bucket" "processor_bucket" {
  # Only create bucket if not pre-release (pre-release uses existing production bucket)
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket = var.mode == "production" ? "kitspace-${var.branch_name}" : "kitspace-staging-${var.branch_name}-5"
}

locals {
  # Use existing production bucket for pre-release, otherwise use the created bucket
  bucket_id = var.mode == "production" && var.branch_name == "pre-release" ? data.aws_s3_bucket.existing_production_bucket[0].id : aws_s3_bucket.processor_bucket[0].id
  bucket_name = var.mode == "production" && var.branch_name == "pre-release" ? data.aws_s3_bucket.existing_production_bucket[0].bucket : aws_s3_bucket.processor_bucket[0].bucket
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  count                   = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket                  = local.bucket_id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  count      = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket     = local.bucket_id
  depends_on = [aws_s3_bucket_public_access_block.public_access]
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "frontend_acl" {
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket = local.bucket_id
  acl    = "public-read"
  depends_on = [
    aws_s3_bucket_ownership_controls.ownership,
    aws_s3_bucket_public_access_block.public_access,
  ]
}

resource "aws_s3_bucket_versioning" "versioning" {
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket = local.bucket_id
  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_policy" "allow_public_read" {
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket = local.bucket_id

  depends_on = [
    aws_s3_bucket_public_access_block.public_access,
    aws_s3_bucket_ownership_controls.ownership,
    aws_s3_bucket_acl.frontend_acl
  ]

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "arn:aws:s3:::${local.bucket_name}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "cors" {
  count  = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  bucket = local.bucket_id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}
