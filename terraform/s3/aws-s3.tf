provider "aws" {
  region = "eu-west-1"
}

locals {
  environments = ["kaspar-dev", "abdo-dev", "master", "review"]
}

resource "aws_s3_bucket" "kitspace_staging" {
  for_each = toset(local.environments)
  bucket   = "kitspace-staging-${each.value}-3"
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_ownership_controls" "ownership" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id

  depends_on = [aws_s3_bucket_public_access_block.public_access]

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "frontend_acl" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id
  acl      = "public-read"

  depends_on = [
    aws_s3_bucket_ownership_controls.ownership,
    aws_s3_bucket_public_access_block.public_access,
  ]
}

resource "aws_s3_bucket_versioning" "versioning" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id
  versioning_configuration {
    status = "Suspended"
  }
}

resource "aws_s3_bucket_policy" "allow_public_read" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id

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
        Resource  = "arn:aws:s3:::kitspace-staging-${each.key}-3/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "cors" {
  for_each = aws_s3_bucket.kitspace_staging
  bucket   = each.value.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}
