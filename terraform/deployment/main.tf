terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.ec2_provider]
    }
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
    github = {
      source = "integrations/github"
    }
  }
}

variable "branch_name" {
  type = string
}
