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

variable "bunnynet_api_key" {
  type      = string
  sensitive = true
}

provider "bunnynet" {
  api_key = var.bunnynet_api_key
}

variable "domain" {
  type = string
}

resource "bunnynet_dns_zone" "kitspace_zone" {
  domain = var.domain
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


variable "branches" {
  type = set(string)
}

module "deployment" {
  for_each             = var.branches
  source               = "./deployment"
  branch_name          = each.value
  bunnynet_dns_zone_id = bunnynet_dns_zone.kitspace_zone.id
  domain               = var.domain
}
