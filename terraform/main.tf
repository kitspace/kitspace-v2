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

data "aws_key_pair" "info_kitspace_aws" {
  key_name           = "info_kitspace_aws"
  include_public_key = true
}

resource "aws_security_group" "kitspace_server" {
  name = "kitspace-server"
  ingress {
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  ingress {
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
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

module "staging" {
  for_each                          = local.staging_branches
  source                            = "./deployment"
  branch_name                       = each.value
  mode                              = "staging"
  bunnynet_dns_zone_id              = bunnynet_dns_zone.kitspace_dev_zone.id
  domain                            = "kitspace.dev"
  kitspace_server_security_group_id = aws_security_group.kitspace_server.id
  ec2_instance_ssh_key_name         = data.aws_key_pair.info_kitspace_aws.key_name
  providers = {
    bunnynet = bunnynet.staging
  }
}

module "pre-release" {
  source                            = "./deployment"
  branch_name                       = "pre-release"
  mode                              = "production"
  bunnynet_dns_zone_id              = bunnynet_dns_zone.kitspace_dev_zone.id
  domain                            = "kitspace.dev"
  kitspace_server_security_group_id = aws_security_group.kitspace_server.id
  ec2_instance_ssh_key_name         = data.aws_key_pair.info_kitspace_aws.key_name
  providers = {
    bunnynet = bunnynet.staging
  }
}

module "production" {
  source                            = "./deployment"
  branch_name                       = "production"
  mode                              = "production"
  bunnynet_dns_zone_id              = bunnynet_dns_zone.kitspace_org_zone.id
  domain                            = "kitspace.org"
  kitspace_server_security_group_id = aws_security_group.kitspace_server.id
  ec2_instance_ssh_key_name         = data.aws_key_pair.info_kitspace_aws.key_name
  providers = {
    bunnynet = bunnynet.production
  }
}
