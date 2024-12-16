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
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    sentry = {
      source  = "jianyuan/sentry"
      version = "~> 0.11.0"
    }
  }
}

// ---------------------------------------------------------
// aws

provider "aws" {
  region = "eu-west-1"
}

// ---------------------------------------------------------
// bunnynet

variable "bunnynet_staging_api_key" {
  type      = string
  sensitive = true
}

variable "bunnynet_production_api_key" {
  type      = string
  sensitive = true
}

provider "bunnynet" {
  api_key = var.bunnynet_staging_api_key
  alias   = "staging"
}

provider "bunnynet" {
  api_key = var.bunnynet_production_api_key
  alias   = "production"
}

moved {
  from = bunnynet_dns_zone.kitspace_zone
  to   = bunnynet_dns_zone.kitspace_dev_zone
}

resource "bunnynet_dns_zone" "kitspace_dev_zone" {
  domain   = "kitspace.dev"
  provider = bunnynet.staging
}

resource "bunnynet_dns_zone" "kitspace_org_zone" {
  domain   = "kitspace.org"
  provider = bunnynet.production
}

// ---------------------------------------------------------
// github

variable "github_token" {
  type      = string
  sensitive = true
}

provider "github" {
  token = var.github_token
  owner = "kitspace"
}

// ---------------------------------------------------------
// sentry

variable "sentry_token" {
  type      = string
  sensitive = true
}

provider "sentry" {
  token = var.sentry_token
}

// ---------------------------------------------------------
// deployment

locals {
  staging_branches = toset(["kaspar-dev", "abdo-dev", "review", "master"])
}

moved {
  from = module.deployment
  to   = module.staging
}

module "staging" {
  for_each             = local.staging_branches
  source               = "./deployment"
  branch_name          = each.value
  bunnynet_dns_zone_id = bunnynet_dns_zone.kitspace_dev_zone.id
  domain               = "kitspace.dev"
  providers = {
    bunnynet = bunnynet.staging
  }
}

module "production" {
  source               = "./deployment"
  branch_name          = "production"
  bunnynet_dns_zone_id = bunnynet_dns_zone.kitspace_org_zone.id
  domain               = "kitspace.org"
  providers = {
    bunnynet = bunnynet.production
  }
}
