terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.55"
    }
    bunnynet = {
      source  = "BunnyWay/bunnynet"
      version = "~> 0.5.2"
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
// hetzner

variable "hetzner_token" {
  type      = string
  sensitive = true
}

provider "hcloud" {
  token = var.hetzner_token
}

resource "hcloud_ssh_key" "kitspace_key" {
  name       = "kitspace_key"
  public_key = data.aws_key_pair.info_kitspace_aws.public_key
}

resource "hcloud_firewall" "kitspace_server" {
  name = "kitspace-server"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
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
  staging_deployments    = toset(["master", "review"])
  production_deployments = toset(["legacy", "pre-release"])
}

module "staging" {
  for_each                          = local.staging_deployments
  source                            = "./deployment"
  deployment_name                   = each.value
  mode                              = "staging"
  bunnynet_dns_zone_id              = bunnynet_dns_zone.kitspace_dev_zone.id
  domain                            = "kitspace.dev"
  kitspace_server_security_group_id = aws_security_group.kitspace_server.id
  ec2_instance_ssh_key_name         = data.aws_key_pair.info_kitspace_aws.key_name
  use_hetzner                       = true
  hetzner_ssh_key_id                = hcloud_ssh_key.kitspace_key.id
  hetzner_firewall_id               = hcloud_firewall.kitspace_server.id
  providers = {
    bunnynet = bunnynet.staging
  }
}

module "production" {
  for_each                          = local.production_deployments
  source                            = "./deployment"
  deployment_name                   = each.value
  mode                              = "production"
  bunnynet_dns_zone_id              = bunnynet_dns_zone.kitspace_org_zone.id
  domain                            = "kitspace.org"
  kitspace_server_security_group_id = aws_security_group.kitspace_server.id
  ec2_instance_ssh_key_name         = data.aws_key_pair.info_kitspace_aws.key_name
  use_hetzner                       = each.value == "pre-release" ? true : false
  hetzner_ssh_key_id                = each.value == "pre-release" ? hcloud_ssh_key.kitspace_key.id : ""
  hetzner_firewall_id               = each.value == "pre-release" ? hcloud_firewall.kitspace_server.id : ""
  providers = {
    bunnynet = bunnynet.production
  }
}
