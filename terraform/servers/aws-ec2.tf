terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

locals {
  environments = ["kaspar-dev", "abdo-dev", "master", "review"]
}

resource "aws_instance" "staging_server" {
  for_each      = toset(local.environments)
  ami           = "ami-01dd271720c1ba44f"
  instance_type = "t2.medium"
  tags = {
    "Name" = each.value
  }
}

resource "aws_eip" "staging_server_ip" {
  for_each = toset(local.environments)
  instance = aws_instance.staging_server[each.value].id
  vpc      = true
  tags = {
    "Name" = each.value
  }
}

output "staging_server_ips" {
  value = {
    for env in local.environments : env => aws_eip.staging_server_ip[env].public_ip
  }
}
