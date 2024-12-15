resource "aws_iam_user" "s3_user" {
  name = "kitspace-staging-${var.branch_name}-s3-user"
}

resource "aws_iam_policy" "s3_kitspace_processor_policy" {
  name        = "kitspace-staging-${var.branch_name}-s3-policy"
  description = "Policy for processor S3 bucket access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::kitspace-staging-${var.branch_name}-5"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::kitspace-staging-${var.branch_name}-5/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "s3_policy_attach" {
  user       = aws_iam_user.s3_user.name
  policy_arn = aws_iam_policy.s3_kitspace_processor_policy.arn
}

resource "aws_iam_access_key" "s3_user_access_key" {
  user = aws_iam_user.s3_user.name
}

output "s3_user_access_key" {
  value     = aws_iam_access_key.s3_user_access_key
  sensitive = true
}
