terraform {
  required_providers {
    github = {
      source  = "integrations/github"
    }
  }
}

variable "github_token" {
  description = "The GitHub token for authentication"
  type        = string
}

provider "github" {
  token = var.github_token
  owner = "kitspace"
}

resource "github_actions_environment_secret" "s3_access_keys" {
  for_each        = aws_iam_access_key.s3_user_access_key
  repository      = "kitspace-v2"
  environment     = "staging"
  secret_name     = "STAGING_S3_ACCESS_KEY_${upper(replace(each.key, "-", "_"))}"
  plaintext_value = each.value.id
}

resource "github_actions_environment_secret" "s3_secret_keys" {
  for_each        = aws_iam_access_key.s3_user_access_key
  repository      = "kitspace-v2"
  environment     = "staging"
  secret_name     = "STAGING_S3_SECRET_KEY_${upper(replace(each.key, "-", "_"))}"
  plaintext_value = each.value.secret
}