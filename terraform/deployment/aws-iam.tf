resource "aws_iam_user" "s3_user" {
  # For pre-release, skip IAM user creation (use production's)
  count = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  name  = "${local.bucket_name}-s3-user"
}

resource "aws_iam_policy" "s3_kitspace_processor_policy" {
  # For pre-release, skip policy creation (use production's)
  count       = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  name        = "${local.bucket_name}-s3-policy"
  description = "Policy for processor S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${local.bucket_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${local.bucket_name}/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "s3_policy_attach" {
  count      = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  user       = aws_iam_user.s3_user[0].name
  policy_arn = aws_iam_policy.s3_kitspace_processor_policy[0].arn
}

resource "aws_iam_access_key" "s3_user_access_key" {
  count = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  user  = aws_iam_user.s3_user[0].name
}
