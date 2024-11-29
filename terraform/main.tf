terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    bunnynet = {
      source  = "BunnyWay/bunnynet"
      version = "~> 0.4.0"
    }
  }
}


provider "aws" {
  region = "eu-west-1"
  alias  = "ec2_provider"
}

provider "aws" {
  region = "eu-west-2"
  alias  = "s3_provider"
}


variable "bunnynet_api_key" {
  type      = string
  sensitive = true
}

provider "bunnynet" {
  api_key = var.bunnynet_api_key
}

resource "bunnynet_dns_zone" "kitspace_zone" {
  domain = "kitspace.dev"
}


locals {
  branches = toset(["kaspar-dev", "abdo-dev", "review", "master"])
}


module "deployment" {
  for_each             = local.branches
  source               = "./deployment"
  branch_name          = each.value
  bunnynet_dns_zone_id = bunnynet_dns_zone.kitspace_zone.id
  providers = {
    aws.ec2_provider = aws.ec2_provider
  }
}
