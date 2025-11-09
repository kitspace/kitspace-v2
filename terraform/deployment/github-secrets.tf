resource "github_actions_environment_secret" "s3_access_keys" {
  # For pre-release, skip secret creation (use production's PRODUCTION_S3_ACCESS_KEY)
  count           = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  repository      = "kitspace-v2"
  environment     = var.mode
  secret_name     = var.mode == "production" ? "${upper(replace(var.branch_name, "-", "_"))}_S3_ACCESS_KEY" : "STAGING_S3_ACCESS_KEY_${upper(replace(var.branch_name, "-", "_"))}"
  plaintext_value = aws_iam_access_key.s3_user_access_key[0].id
}

resource "github_actions_environment_secret" "s3_secret_keys" {
  # For pre-release, skip secret creation (use production's PRODUCTION_S3_SECRET_KEY)
  count           = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  repository      = "kitspace-v2"
  environment     = var.mode
  secret_name     = var.mode == "production" ? "${upper(replace(var.branch_name, "-", "_"))}_S3_SECRET_KEY" : "STAGING_S3_SECRET_KEY_${upper(replace(var.branch_name, "-", "_"))}"
  plaintext_value = aws_iam_access_key.s3_user_access_key[0].secret
}
