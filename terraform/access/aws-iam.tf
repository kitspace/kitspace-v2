locals {
  environments = ["abdo-dev", "kaspar-dev", "master", "review"]
}

resource "aws_iam_user" "s3_user" {
  for_each = toset(local.environments)
  name     = "kitspace-staging-${each.value}-s3-user"
}

resource "aws_iam_policy" "s3_kitspace_processor_policy" {
  for_each    = toset(local.environments)
  name        = "kitspace-staging-${each.value}-s3-policy"
  description = "Policy for processor S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::kitspace-staging-${each.value}-4"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::kitspace-staging-${each.value}-4/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "s3_policy_attach" {
  for_each   = toset(local.environments)
  user       = aws_iam_user.s3_user[each.key].name
  policy_arn = aws_iam_policy.s3_kitspace_processor_policy[each.key].arn
}

resource "aws_iam_access_key" "s3_user_access_key" {
  for_each = toset(local.environments)
  user     = aws_iam_user.s3_user[each.key].name
}

output "s3_user_access_keys" {
  value = {
    for env, key in aws_iam_access_key.s3_user_access_key : env => {
      id     = key.id
      secret = key.secret
    }
  }
  sensitive = true
}
