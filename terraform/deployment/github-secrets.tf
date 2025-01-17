resource "github_actions_environment_secret" "s3_access_keys" {
  repository      = "kitspace-v2"
  environment     = var.mode
  secret_name     = var.mode == "production" ? "${upper(replace(var.branch_name, "-", "_"))}_S3_ACCESS_KEY" : "STAGING_S3_ACCESS_KEY_${upper(replace(var.branch_name, "-", "_"))}"
  plaintext_value = aws_iam_access_key.s3_user_access_key.id
}

resource "github_actions_environment_secret" "s3_secret_keys" {
  repository      = "kitspace-v2"
  environment     = var.mode
  secret_name     = var.mode == "production" ? "${upper(replace(var.branch_name, "-", "_"))}_S3_SECRET_KEY" : "STAGING_S3_SECRET_KEY_${upper(replace(var.branch_name, "-", "_"))}"
  plaintext_value = aws_iam_access_key.s3_user_access_key.secret
}
