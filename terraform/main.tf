provider "aws" {
  region = "eu-west-1"
  alias  = "ec2_provider"
}

provider "aws" {
  region = "eu-west-2"
  alias  = "s3_provider"
}

locals {
  branches = toset(
    terraform.workspace == "production"
    ? ["production"]
    : ["kaspar-dev", "abdo-dev", "review", "master"]
  )
}

module "deployment" {
  for_each    = local.branches
  source      = "./deployment"
  branch_name = each.value
  providers = {
    aws.ec2_provider = aws.ec2_provider
  }
}
